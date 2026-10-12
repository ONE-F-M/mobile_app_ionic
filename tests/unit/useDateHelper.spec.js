import { describe, expect, it, beforeEach, vi } from 'vitest';
import 'dayjs/locale/ar';

// The lang store is mocked so each test controls langStore.lang directly.
const langStore = { lang: null };
vi.mock('@/store/lang', () => ({
  useLangStore: () => langStore,
}));

import useDateHelper from '@/composable/useDateHelper';

describe('useDateHelper formatDate', () => {
  beforeEach(() => {
    langStore.lang = null;
  });

  it('returns a formatted English date when lang is null', () => {
    langStore.lang = null;
    const { formatDate } = useDateHelper();

    expect(formatDate('2024-03-05 14:30:00', 'DD/MM/YY')).toBe('05/03/24');
    expect(formatDate('2024-03-05 14:30:00', 'hh:mm A')).toBe('02:30 PM');
  });

  it('does not return null for a valid date when lang is null', () => {
    langStore.lang = null;
    const { formatDate } = useDateHelper();

    expect(formatDate('2024-03-05 14:30:00')).not.toBeNull();
  });

  it('still returns null for an invalid date', () => {
    langStore.lang = null;
    const { formatDate } = useDateHelper();

    expect(formatDate('not-a-date')).toBeNull();
  });

  it('uses the Arabic locale when lang is "ar"', () => {
    langStore.lang = 'ar';
    const { formatDate } = useDateHelper();

    const result = formatDate('2024-03-05 14:30:00', 'hh:mm A');
    expect(result).not.toBe('02:30 PM');
    expect(result).toContain('م');
  });
});
