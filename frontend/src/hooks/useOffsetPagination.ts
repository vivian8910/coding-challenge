import { useState } from 'react';

export type UseOffsetPaginationOptions = {
  pageSize: number;
  resetKey: string;
};

export type UseOffsetPaginationResult = {
  offset: number;
  setOffset: (offset: number) => void;
  goToNextPage: (hasNext: boolean | undefined) => void;
  goToPreviousPage: () => void;
};

/**
 * Shared offset-based pagination state with previous/next navigation and
 * automatic reset to the first page when query-defining state changes.
 */
export const useOffsetPagination = ({
  pageSize,
  resetKey,
}: UseOffsetPaginationOptions): UseOffsetPaginationResult => {
  const [offset, setOffset] = useState(0);
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setOffset(0);
  }

  const goToNextPage = (hasNext: boolean | undefined) => {
    if (!hasNext) return;
    setOffset((currentOffset) => currentOffset + pageSize);
  };

  const goToPreviousPage = () => {
    setOffset((currentOffset) => Math.max(0, currentOffset - pageSize));
  };

  return { offset, setOffset, goToNextPage, goToPreviousPage };
};
