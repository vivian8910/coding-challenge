import type { PaginationMeta } from '@sec-edgar/shared';
import { getPageInfo } from '../utils/pagination';

export type PaginationControlsProps = {
  pagination: PaginationMeta | undefined;
  offset: number;
  itemLabel: string;
  onPrevious: () => void;
  onNext: () => void;
};

/**
 * Shared pagination footer with result count, page indicator, and previous/next controls.
 */
export const PaginationControls = ({
  pagination,
  offset,
  itemLabel,
  onPrevious,
  onNext,
}: PaginationControlsProps) => {
  const pageInfo = pagination ? getPageInfo(pagination) : undefined;
  const pageIndicator = pageInfo ? `Page ${pageInfo.currentPage} of ${pageInfo.totalPages}` : undefined;

  return (
    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
      <span>{pagination ? `${pagination.total} ${itemLabel}` : null}</span>
      <div className="flex items-center gap-3">
        {pagination && <span>{pageIndicator}</span>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={offset === 0}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!pagination?.hasNext}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
