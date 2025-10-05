import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { getValidFacebookToken, handleFacebookTokenError } from '@/lib/server/api/facebook-auth';

/**
 * Lấy danh sách chiến dịch quảng cáo Facebook cùng dữ liệu insights cho ad account được truyền trong query.
 *
 * Trả về các phản hồi JSON sau đây tùy trường hợp:
 * - Khi thành công: `{ campaigns: CampaignWithInsights[] }` nơi mỗi phần tử là một campaign kèm trường `insights`.
 * - Khi người dùng chưa xác thực: `{ error: 'Unauthorized' }` với status 401.
 * - Khi thiếu `adAccountId` trong query: `{ error: 'Ad account ID is required' }` với status 400.
 * - Khi việc lấy token gặp lỗi: trả về `{ error: string }` với status do `getValidFacebookToken` cung cấp.
 * - Khi token Facebook hết hạn: `{ error: 'Token expired', tokenExpired: true }` với status 401.
 * - Các lỗi khác: `{ error: string }` với status 500.
 *
 * @returns JSON phản hồi mô tả kết quả theo các trường hợp ở trên
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get('adAccountId');

    if (!adAccountId) {
      return NextResponse.json({ error: 'Ad account ID is required' }, { status: 400 });
    }

    const user = await getOrCreateUserFromClerk(userId);
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);
    
    if ('error' in tokenResult) {
      return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
    }

    const { token, adAccount } = tokenResult;
    const api = new FacebookMarketingAPI(token);

    try {
      const campaigns = await api.getCampaigns(adAccount.facebookAdAccountId!);

      const campaignsWithInsights = await Promise.all(
        campaigns.map(async (campaign) => {
          const insights = await api.getCampaignInsights(campaign.id);
          return {
            ...campaign,
            insights,
          };
        })
      );

      return NextResponse.json({ campaigns: campaignsWithInsights });
    } catch (apiError: any) {
      await handleFacebookTokenError(adAccount.id, apiError);
      
      if (apiError.message === 'FACEBOOK_TOKEN_EXPIRED') {
        return NextResponse.json({ error: 'Token expired', tokenExpired: true }, { status: 401 });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Error fetching Facebook campaigns:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

/**
 * Tạo một chiến dịch quảng cáo trên Facebook cho tài khoản quảng cáo được chỉ định.
 *
 * Yêu cầu body JSON chứa `adAccountId`, `name` và `objective`; chấp nhận tùy chọn `status`, `dailyBudget` và `lifetimeBudget`.
 *
 * @param req - Yêu cầu HTTP chứa body JSON mô tả chiến dịch
 * @returns Đối tượng JSON: khi thành công trả về `{ success: true, campaign: <data> }`; khi lỗi trả về `{ error: <message> }` cùng mã HTTP phù hợp (ví dụ 401, 400, 500)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { adAccountId, name, objective, status, dailyBudget, lifetimeBudget } = body;

    if (!adAccountId || !name || !objective) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await getOrCreateUserFromClerk(userId);
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);
    
    if ('error' in tokenResult) {
      return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
    }

    const { token, adAccount } = tokenResult;

    const formattedAccountId = adAccount.facebookAdAccountId!.startsWith('act_')
      ? adAccount.facebookAdAccountId
      : `act_${adAccount.facebookAdAccountId}`;

    const campaignData: any = {
      name,
      objective,
      status: status || 'PAUSED',
    };

    if (dailyBudget) campaignData.daily_budget = dailyBudget;
    if (lifetimeBudget) campaignData.lifetime_budget = lifetimeBudget;

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${formattedAccountId}/campaigns?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to create campaign');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, campaign: data });
  } catch (error) {
    console.error('Error creating Facebook campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

/**
 * Xóa một chiến dịch quảng cáo Facebook cho người dùng đã xác thực dựa trên `adAccountId` và `campaignId` trong query string.
 *
 * Xác thực người dùng bằng Clerk; kiểm tra `adAccountId` và `campaignId`; lấy token Facebook hợp lệ qua `getValidFacebookToken`; gửi yêu cầu DELETE tới Graph API và trả về kết quả.
 *
 * Trả về phản hồi JSON với mã trạng thái thích hợp:
 * - 200: { success: true } khi xóa thành công
 * - 401: khi người dùng không xác thực
 * - 400: khi thiếu tham số bắt buộc
 * - chuyển tiếp lỗi từ `getValidFacebookToken` với status tương ứng
 * - 500: khi xảy ra lỗi server khác, kèm { error: string }
 *
 * @returns Phản hồi JSON mô tả kết quả xóa hoặc thông tin lỗi cùng mã trạng thái HTTP tương ứng
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get('adAccountId');
    const campaignId = searchParams.get('campaignId');

    if (!adAccountId || !campaignId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const user = await getOrCreateUserFromClerk(userId);
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);
    
    if ('error' in tokenResult) {
      return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
    }

    const { token } = tokenResult;

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${campaignId}?access_token=${token}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to delete campaign');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Facebook campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}