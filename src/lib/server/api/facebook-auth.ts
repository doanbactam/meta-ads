import { prisma } from '@/lib/server/prisma';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { AdAccount } from '@prisma/client';

/**
 * Xác thực và trả về access token Facebook hợp lệ cho một ad account.
 *
 * Nếu token bị hết hạn hoặc không hợp lệ, hàm sẽ đánh dấu ad account là "paused" và trả về đối tượng lỗi có mã trạng thái phù hợp.
 *
 * @param adAccountId - ID của ad account cần kiểm tra
 * @param userId - ID người dùng sở hữu ad account
 * @returns Đối tượng chứa `token` và `adAccount` khi token hợp lệ; hoặc `{ error, status }` khi có lỗi (ví dụ: không tìm thấy tài khoản, chưa kết nối Facebook, token hết hạn/không hợp lệ)
 */
export async function getValidFacebookToken(
  adAccountId: string,
  userId: string
): Promise<{ token: string; adAccount: AdAccount } | { error: string; status: number }> {
  const adAccount = await prisma.adAccount.findFirst({
    where: {
      id: adAccountId,
      userId: userId,
    },
  });

  if (!adAccount) {
    return { error: 'Ad account not found', status: 404 };
  }

  if (!adAccount.facebookAccessToken || !adAccount.facebookAdAccountId) {
    return { error: 'Facebook not connected', status: 400 };
  }

  // Check if token is expired based on stored expiry date
  if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
    // Mark account as paused
    await prisma.adAccount.update({
      where: { id: adAccount.id },
      data: { status: 'paused' },
    });

    return { error: 'Facebook token expired. Please reconnect your account.', status: 401 };
  }

  // Validate token with Facebook API
  const api = new FacebookMarketingAPI(adAccount.facebookAccessToken);
  const validation = await api.validateToken();

  if (!validation.isValid) {
    // Mark account as paused and update token expiry to now
    await prisma.adAccount.update({
      where: { id: adAccount.id },
      data: {
        status: 'paused',
        facebookTokenExpiry: new Date(),
      },
    });

    return { error: validation.error || 'Facebook token is invalid. Please reconnect.', status: 401 };
  }

  return { token: adAccount.facebookAccessToken, adAccount };
}

/**
 * Xác định xem lỗi trả về có chỉ ra rằng token Facebook đã hết hạn hoặc không hợp lệ hay không.
 *
 * @param error - Đối tượng lỗi nhận được từ API (có thể chứa `message`, `error`, hoặc `code`)
 * @returns `true` nếu lỗi chỉ ra token Facebook hết hạn hoặc không hợp lệ, `false` nếu không
 */
export function isFacebookTokenExpiredError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message || error.error || '';
  const errorCode = error.code;

  return (
    errorMessage.includes('Session has expired') ||
    errorMessage.includes('access token') ||
    errorMessage.includes('token is invalid') ||
    errorMessage.includes('Error validating access token') ||
    errorMessage === 'FACEBOOK_TOKEN_EXPIRED' ||
    errorCode === 190 // Invalid OAuth 2.0 Access Token
  );
}

/**
 * Đặt trạng thái tài khoản quảng cáo sang "paused" và cập nhật `facebookTokenExpiry` nếu lỗi Facebook chỉ ra token đã hết hạn hoặc không hợp lệ.
 *
 * @param adAccountId - ID của ad account cần xử lý
 * @param error - Lỗi nhận được từ Facebook API, được kiểm tra để xác định xem có phải lỗi liên quan đến token hay không
 */
export async function handleFacebookTokenError(
  adAccountId: string,
  error: any
): Promise<void> {
  if (isFacebookTokenExpiredError(error)) {
    await prisma.adAccount.update({
      where: { id: adAccountId },
      data: {
        status: 'paused',
        facebookTokenExpiry: new Date(),
      },
    });
  }
}