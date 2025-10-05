'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableConfig } from './types';

interface TableEmptyStateProps<T> {
  type: 'loading' | 'error' | 'empty';
  config: TableConfig<T>;
  error?: Error;
  visibleColumnsCount: number;
  showBulkActions: boolean;
  connected: boolean;
  adAccountId?: string;
  onRefresh: () => void;
  onConnect: () => void;
}

/**
 * Hiển thị một hàng bảng (<tr>) mô tả trạng thái trống của bảng: đang tải, lỗi hoặc không có dữ liệu.
 *
 * Hiển thị nội dung tương ứng với `type`: trạng thái "loading" hiển thị thông báo tải, "error" hiển thị thông báo lỗi kèm nút thử lại (và nút kết nối lại Facebook khi token hết hạn), còn trạng thái rỗng hiển thị tiêu đề mô tả, mô tả phụ (nếu có) và các hành động (làm mới, kết nối Facebook, hành động tùy chỉnh).
 *
 * @param type - Kiểu trạng thái hiển thị: 'loading' | 'error' | 'empty'
 * @param config - Cấu hình hiển thị bao gồm `title` và tùy chọn `emptyState` ({ title?, description?, action? }) để tùy chỉnh nội dung trạng thái rỗng
 * @param error - Đối tượng Error dùng khi `type` là 'error'; nếu `error.message` bằng 'FACEBOOK_TOKEN_EXPIRED' sẽ hiển thị thông báo token hết hạn và nút kết nối lại
 * @param visibleColumnsCount - Số cột hiển thị hiện tại dùng để tính `colSpan`
 * @param showBulkActions - Nếu true sẽ cộng thêm một cột cho các hành động hàng loạt khi tính `colSpan`
 * @param connected - Trạng thái kết nối Facebook; ảnh hưởng đến việc hiện nút "Connect Facebook" trong trạng thái rỗng
 * @param adAccountId - Nếu có và `connected` là false, sẽ hiển thị nút "Connect Facebook" trong trạng thái rỗng
 * @param onRefresh - Callback được gọi khi người dùng nhấn nút làm mới / thử lại
 * @param onConnect - Callback được gọi khi người dùng nhấn nút kết nối hoặc kết nối lại Facebook
 *
 * @returns Một phần tử React <tr> phù hợp với trạng thái được chỉ định, với nội dung trải rộng theo `colSpan`
 */
export function TableEmptyState<T>({
  type,
  config,
  error,
  visibleColumnsCount,
  showBulkActions,
  connected,
  adAccountId,
  onRefresh,
  onConnect,
}: TableEmptyStateProps<T>) {
  const colSpan = visibleColumnsCount + (showBulkActions ? 1 : 0);

  if (type === 'loading') {
    return (
      <tr>
        <td colSpan={colSpan} className="p-8 text-center text-muted-foreground">
          Loading {config.title.toLowerCase()}...
        </td>
      </tr>
    );
  }

  if (type === 'error') {
    return (
      <tr>
        <td colSpan={colSpan} className="p-8 text-center">
          <div className="space-y-3">
            <div className="text-destructive">
              {error?.message === 'FACEBOOK_TOKEN_EXPIRED' 
                ? 'Facebook access token has expired' 
                : `Error loading ${config.title.toLowerCase()}: ${error?.message}`
              }
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button 
                size="sm" 
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={onRefresh}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
              {error?.message === 'FACEBOOK_TOKEN_EXPIRED' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1.5 px-3 text-xs"
                  onClick={onConnect}
                >
                  Reconnect Facebook
                </Button>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  }

  // Empty state
  return (
    <tr>
      <td colSpan={colSpan} className="p-8 text-center">
        <div className="space-y-3">
          <div className="text-muted-foreground">
            {config.emptyState?.title || `No ${config.title.toLowerCase()} found`}
          </div>
          {config.emptyState?.description && (
            <div className="text-xs text-muted-foreground">
              {config.emptyState.description}
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <Button 
              size="sm" 
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={onRefresh}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            {adAccountId && !connected && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={onConnect}
              >
                Connect Facebook
              </Button>
            )}
            {config.emptyState?.action && (
              <Button 
                size="sm" 
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={config.emptyState.action.onClick}
              >
                {config.emptyState.action.label}
              </Button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}