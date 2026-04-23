import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }: TablePaginationProps) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-3">
      <p className="text-[12px] text-muted-foreground">
        Exibindo <span className="font-medium text-foreground">{start}</span> a <span className="font-medium text-foreground">{end}</span> de <span className="font-medium text-foreground">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-[12px] font-medium transition-colors ${
              page === currentPage
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
