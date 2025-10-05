'use client';

import { Search, Plus, Edit, Copy, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColumnsSelector } from '@/components/table/columns-selector';
import { FacebookDateRangePicker } from '@/components/facebook/facebook-date-range-picker';
import { TableConfig, TableColumn } from './types';

interface TableToolbarProps<T> {
  config: TableConfig<T>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  visibleColumns: string[];
  onColumnsChange: (columns: string[]) => void;
  selectedRows: string[];
  onRefresh: () => void;
  isRefreshing?: boolean;
  features: {
    search: boolean;
    dateRange: boolean;
    columnSelector: boolean;
    bulkActions: boolean;
  };
}

/**
 * Hiển thị thanh công cụ cho bảng dữ liệu với tìm kiếm, bộ lọc khoảng ngày, lựa chọn cột và các hành động (tạo, chỉnh sửa, nhân bản, xóa, tùy chỉnh, làm mới).
 *
 * @param config - Cấu hình bảng gồm `title`, định nghĩa `columns` và các `actions` (create, edit, duplicate, delete, custom)
 * @param searchQuery - Giá trị hiện tại của ô tìm kiếm
 * @param onSearchChange - Hàm được gọi khi giá trị tìm kiếm thay đổi
 * @param dateRange - Khoảng ngày hiện tại { from, to }
 * @param onDateRangeChange - Hàm được gọi khi khoảng ngày thay đổi
 * @param visibleColumns - Danh sách id các cột đang hiển thị
 * @param onColumnsChange - Hàm được gọi khi thay đổi các cột hiển thị
 * @param selectedRows - Danh sách id các hàng đang được chọn (dùng cho bulk actions)
 * @param onRefresh - Hàm được gọi khi nhấn nút làm mới
 * @param isRefreshing - Nếu là `true`, nút làm mới bị vô hiệu hóa và hiển thị trạng thái đang làm mới
 * @param features - Cờ bật/tắt các tính năng hiển thị: `{ search, dateRange, columnSelector, bulkActions }`
 * @returns Phần tử React chứa các điều khiển toolbar phù hợp với cấu hình và các feature được bật
 */
export function TableToolbar<T>({
  config,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  visibleColumns,
  onColumnsChange,
  selectedRows,
  onRefresh,
  isRefreshing = false,
  features,
}: TableToolbarProps<T>) {
  return (
    <div className="space-y-3">
      {/* Search and Date Range */}
      {(features.search || features.dateRange) && (
        <div className="flex items-center justify-between">
          {features.search && (
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder={`search ${config.title.toLowerCase()}...`}
                className="h-8 pl-8 text-xs"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {features.dateRange && (
            <FacebookDateRangePicker value={dateRange} onChange={onDateRangeChange} />
          )}
        </div>
      )}

      {/* Actions */}
      {config.actions && (
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {config.actions?.create && (
              <Button 
                size="sm" 
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={config.actions?.create?.onClick}
              >
                <Plus className="h-3.5 w-3.5" />
                {config.actions?.create?.label}
              </Button>
            )}
            
            {features.bulkActions && selectedRows.length > 0 && (
              <>
                {config.actions?.edit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => config.actions?.edit?.onClick(selectedRows)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {config.actions?.edit?.label}
                  </Button>
                )}
                
                {config.actions?.duplicate && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => config.actions?.duplicate?.onClick(selectedRows)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {config.actions?.duplicate?.label}
                  </Button>
                )}
                
                {config.actions?.delete && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => config.actions?.delete?.onClick(selectedRows)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {config.actions?.delete?.label}
                  </Button>
                )}
              </>
            )}
          </div>
          
          <div className="flex gap-1.5">
            {features.columnSelector && (
              <ColumnsSelector
                columns={config.columns.map(col => ({ id: col.id, label: col.label }))}
                visibleColumns={visibleColumns}
                onColumnsChange={onColumnsChange}
              />
            )}
            
            {config.actions?.custom?.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={() => action.onClick(selectedRows)}
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={onRefresh}
              disabled={isRefreshing}
              title={isRefreshing ? "Refreshing..." : "Refresh data"}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'refreshing...' : 'refresh'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}