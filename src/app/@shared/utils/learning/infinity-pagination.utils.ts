import { map, Observable, of, switchMap } from 'rxjs';

/** Matches backend infinity list cap used across learning services. */
export const INFINITY_PAGE_LIMIT = 50;

/** Safety cap to avoid unbounded paging if the API misbehaves. */
export const INFINITY_MAX_PAGES = 40;

/**
 * Loads every page from an infinity-shaped endpoint (`{ data: T[] }`) until the last
 * partial page or `maxPages` is reached.
 *
 * @param loadPage - Callback that requests one page (1-based `page`, fixed `limit`).
 * @param options - Optional `limit` / `maxPages` overrides.
 */
export function fetchAllInfinityPages<T>(
  loadPage: (page: number, limit: number) => Observable<{ data: T[] }>,
  options?: { limit?: number; maxPages?: number },
): Observable<T[]> {
  const limit = options?.limit ?? INFINITY_PAGE_LIMIT;
  const maxPages = options?.maxPages ?? INFINITY_MAX_PAGES;

  const loadFromPage = (page: number): Observable<T[]> =>
    loadPage(page, limit).pipe(
      switchMap((res) => {
        const chunk = res.data ?? [];
        if (chunk.length < limit || page >= maxPages) {
          return of(chunk);
        }
        return loadFromPage(page + 1).pipe(map((rest) => [...chunk, ...rest]));
      }),
    );

  return loadFromPage(1);
}

/**
 * Merges two lists by `id`; later items in `incoming` overwrite earlier map entries.
 */
export function mergeRecordsById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const byId = new Map(current.map((item) => [String(item.id), item]));
  incoming.forEach((item) => byId.set(String(item.id), item));
  return [...byId.values()];
}
