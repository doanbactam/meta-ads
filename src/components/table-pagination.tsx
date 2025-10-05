'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TablePaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
}

export function TablePagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = '',
}: TablePaginationProps) {
  const [goToPage, setGoToPage] = useState(currentPage.toString());
  
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePreviousPage = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const handleGoToPage = () => {
    const page = parseInt(goToPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setGoToPage(currentPage.toString());
    }
  };

  const handleGoToPageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  return (
    <div className={`flex items-center justify-between text-xs ${className}`}>
      <div className="text-muted-foreground">
        {totalItems === 0 ? (
          'No items'
        ) : (
          <>
            showing {startItem.toLocaleString()}-{endItem.toLocaleString()} of {totalItems.toLocaleString()}
          </>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handlePreviousPage}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-muted-foreground min-w-[60px] text-center">
            {totalPages === 0 ? '0 / 0' : `${currentPage} / ${totalPages}`}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleNextPage}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">rows:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(parseInt(value))}>
            <SelectTrigger size="sm" className="w-14 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Go to Page */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">go to:</span>
            <Input 
              type="number" 
              className="h-7 w-14 text-xs" 
              value={goToPage}
              onChange={(e) => setGoToPage(e.target.value)}
              onBlur={handleGoToPage}
              onKeyDown={handleGoToPageKeyDown}
              min="1"
              max={totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
}