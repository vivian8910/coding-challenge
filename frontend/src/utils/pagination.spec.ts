import { describe, expect, it } from 'vitest';
import { getPageInfo } from './pagination';

describe('getPageInfo', () => {
  it('reports page 1 of 1 when there is a single page', () => {
    expect(getPageInfo({ offset: 0, limit: 10, total: 5, hasNext: false })).toEqual({
      currentPage: 1,
      totalPages: 1,
    });
  });

  it('derives the current page from offset and limit', () => {
    expect(getPageInfo({ offset: 20, limit: 10, total: 45, hasNext: true })).toEqual({
      currentPage: 3,
      totalPages: 5,
    });
  });

  it('reports 1 of 1 when there are no results', () => {
    expect(getPageInfo({ offset: 0, limit: 10, total: 0, hasNext: false })).toEqual({
      currentPage: 1,
      totalPages: 1,
    });
  });
});
