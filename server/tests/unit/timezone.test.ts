import { describe, it, expect } from 'vitest';
import {
  getIstDayOfWeek,
  getIstCurrentDate,
  getIstCurrentTime
} from '../../src/common/utils/timezone';

describe('Timezone Utilities (Asia/Kolkata)', () => {
  describe('getIstDayOfWeek', () => {
    it('should correctly calculate DayOfWeek for a given calendar date in IST', () => {
      // 2026-10-15 is Thursday
      expect(getIstDayOfWeek('2026-10-15')).toBe('THU');
      // 2026-10-18 is Sunday
      expect(getIstDayOfWeek('2026-10-18')).toBe('SUN');
      // 2026-10-19 is Monday
      expect(getIstDayOfWeek('2026-10-19')).toBe('MON');
      // 2026-10-20 is Tuesday
      expect(getIstDayOfWeek('2026-10-20')).toBe('TUE');
      // 2026-10-21 is Wednesday
      expect(getIstDayOfWeek('2026-10-21')).toBe('WED');
      // 2026-10-23 is Friday
      expect(getIstDayOfWeek('2026-10-23')).toBe('FRI');
      // 2026-10-24 is Saturday
      expect(getIstDayOfWeek('2026-10-24')).toBe('SAT');
    });

    it('should accept a Date instance and return valid DayOfWeek', () => {
      const d = new Date('2026-10-15T10:00:00+05:30');
      expect(getIstDayOfWeek(d)).toBe('THU');
    });

    it('should return a valid DayOfWeek when called without arguments (current time)', () => {
      const today = getIstDayOfWeek();
      expect(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).toContain(today);
    });

    it('should throw an error when an invalid date string is provided', () => {
      expect(() => getIstDayOfWeek('not-a-valid-date')).toThrow(/Invalid date/);
    });
  });

  describe('getIstCurrentDate', () => {
    it('should return a string in YYYY-MM-DD format', () => {
      const dateStr = getIstCurrentDate();
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getIstCurrentTime', () => {
    it('should return a string in HH:mm 24-hour format', () => {
      const timeStr = getIstCurrentTime();
      expect(timeStr).toMatch(/^([01]\d|2[0-3]):([0-5]\d)$/);
    });
  });
});
