import { formatNationalNumber } from '@/lib/eid';

export function normalizeNiss(value?: string | null) {
  return (value ?? '').replace(/\D/g, '');
}

export function formatNiss(value?: string | null) {
  if (!value) {
    return '';
  }

  const digits = normalizeNiss(value);
  return digits.length === 11 ? formatNationalNumber(digits) : value;
}

export function maskNiss(value?: string | null, visibleEndDigits = 2) {
  const formatted = formatNiss(value);
  const digits = normalizeNiss(value);

  if (formatted.length === 0 || digits.length === 0) {
    return '—';
  }

  const revealFrom = Math.max(digits.length - visibleEndDigits, 0);
  let digitIndex = 0;

  return formatted.replace(/\d/g, (digit) => {
    const shouldReveal = digitIndex >= revealFrom;
    digitIndex += 1;
    return shouldReveal ? digit : '•';
  });
}

export function matchesNissSearch(value?: string | null, query?: string | null) {
  const normalizedQuery = normalizeNiss(query);

  if (normalizedQuery.length === 0) {
    return false;
  }

  return normalizeNiss(value).includes(normalizedQuery);
}
