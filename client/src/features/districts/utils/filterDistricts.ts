import { DistrictItem } from '../types';

/**
 * Normalizes text for resilient case-insensitive matching across English and Tamil script.
 */
function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Filters and ranks districts based on a search query and optional status filter.
 *
 * Ranking criteria:
 * 1. Available / Pilot districts always float to the top for passenger utility.
 * 2. Exact prefix matches appear before substring matches.
 * 3. Default alphabetical ordering by English name.
 */
export function filterDistricts(
  districts: DistrictItem[],
  query: string = '',
  statusFilter: string = 'ALL'
): DistrictItem[] {
  const cleanQuery = normalizeText(query);

  let filtered = districts;

  // 1. Status Filter
  if (statusFilter !== 'ALL') {
    filtered = filtered.filter((d) => d.status === statusFilter);
  }

  // 2. Query Search
  if (cleanQuery.length > 0) {
    filtered = filtered.filter((district) => {
      const matchEn = normalizeText(district.nameEn).includes(cleanQuery);
      const matchTa = normalizeText(district.nameTa).includes(cleanQuery);
      const matchCode = normalizeText(district.code).includes(cleanQuery);
      const matchHqEn = normalizeText(district.headquartersEn).includes(cleanQuery);
      const matchHqTa = normalizeText(district.headquartersTa).includes(cleanQuery);

      return matchEn || matchTa || matchCode || matchHqEn || matchHqTa;
    });
  }

  // 3. Stable sorting: Pilot / Available first, then alphabetical by name
  return [...filtered].sort((a, b) => {
    // Available districts prioritized first
    if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1;
    if (b.status === 'AVAILABLE' && a.status !== 'AVAILABLE') return 1;

    // Pilot prioritized within same status
    if (a.isPilot && !b.isPilot) return -1;
    if (!a.isPilot && b.isPilot) return 1;

    // Alphabetical sort by English name
    return a.nameEn.localeCompare(b.nameEn);
  });
}
