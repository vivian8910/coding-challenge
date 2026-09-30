import type { PaginationMeta } from '@sec-edgar/shared';

export type PageInfo = {
  currentPage: number;
  totalPages: number;
};

/** Derives a 1-based current/total page indicator from offset/limit/total pagination metadata. */
export const getPageInfo = (pagination: PaginationMeta): PageInfo => {
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return { currentPage, totalPages };
};
