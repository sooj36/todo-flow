// lib/utils/dateTransform.test.ts
// Phase 14.1: 날짜 변환 유닛 테스트

import { describe, it, expect } from 'vitest';
import {
  formatLocalDate,
  parseLocalDateString,
  localDateToUTC,
  notionDateToLocal,
  isValidDateString,
  compareDateStrings,
  addDays,
  getDayOfWeek,
  jsWeekdayToKorIndex,
  isDateInWeekdays,
} from './dateTransform';

// ============================================
// formatLocalDate Tests
// ============================================
describe('formatLocalDate', () => {
  it('should format date to YYYY-MM-DD', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(formatLocalDate(date)).toBe('2024-01-15');
  });

  it('should pad single digit month and day', () => {
    const date = new Date(2024, 0, 5); // Jan 5, 2024
    expect(formatLocalDate(date)).toBe('2024-01-05');
  });

  it('should handle December correctly', () => {
    const date = new Date(2024, 11, 31); // Dec 31, 2024
    expect(formatLocalDate(date)).toBe('2024-12-31');
  });
});

// ============================================
// parseLocalDateString Tests
// ============================================
describe('parseLocalDateString', () => {
  it('should parse YYYY-MM-DD to local Date', () => {
    const date = parseLocalDateString('2024-01-15');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(15);
  });

  it('should set time to 00:00:00', () => {
    const date = parseLocalDateString('2024-01-15');
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });

  it('should throw error for invalid format', () => {
    expect(() => parseLocalDateString('01-15-2024')).toThrow('Invalid date');
    expect(() => parseLocalDateString('2024/01/15')).toThrow('Invalid date');
    expect(() => parseLocalDateString('')).toThrow('Invalid date');
  });

  it('should throw error for non-existent dates', () => {
    expect(() => parseLocalDateString('2024-02-30')).toThrow('Invalid date');
    expect(() => parseLocalDateString('2024-13-01')).toThrow('Invalid date');
  });
});

// ============================================
// localDateToUTC Tests
// ============================================
describe('localDateToUTC', () => {
  it('should convert local date string to UTC ISO string', () => {
    const result = localDateToUTC('2024-01-15');
    expect(result).toBe('2024-01-15T00:00:00.000Z');
  });

  it('should throw error for invalid format', () => {
    expect(() => localDateToUTC('01-15-2024')).toThrow('Invalid date');
    expect(() => localDateToUTC('2024/01/15')).toThrow('Invalid date');
    expect(() => localDateToUTC('')).toThrow('Invalid date');
  });

  it('should throw error for non-existent dates', () => {
    expect(() => localDateToUTC('2024-02-30')).toThrow('Invalid date');
    expect(() => localDateToUTC('2024-13-01')).toThrow('Invalid date');
    expect(() => localDateToUTC('2023-02-29')).toThrow('Invalid date'); // not leap year
  });

  it('should handle edge dates', () => {
    expect(localDateToUTC('2024-12-31')).toBe('2024-12-31T00:00:00.000Z');
    expect(localDateToUTC('2024-01-01')).toBe('2024-01-01T00:00:00.000Z');
  });
});

// ============================================
// notionDateToLocal Tests
// ============================================
describe('notionDateToLocal', () => {
  it('should return YYYY-MM-DD as-is', () => {
    expect(notionDateToLocal('2024-01-15')).toBe('2024-01-15');
  });

  it('should extract date from ISO string', () => {
    expect(notionDateToLocal('2024-01-15T00:00:00.000Z')).toBe('2024-01-15');
    expect(notionDateToLocal('2024-01-15T12:30:00.000+09:00')).toBe('2024-01-15');
  });

  it('should return null for null/undefined input', () => {
    expect(notionDateToLocal(null)).toBe(null);
    expect(notionDateToLocal(undefined)).toBe(null);
  });
});

// ============================================
// isValidDateString Tests
// ============================================
describe('isValidDateString', () => {
  it('should accept valid dates', () => {
    expect(isValidDateString('2024-01-15')).toBe(true);
    expect(isValidDateString('2024-12-31')).toBe(true);
    expect(isValidDateString('2024-02-29')).toBe(true); // leap year
  });

  it('should reject invalid format', () => {
    expect(isValidDateString('01-15-2024')).toBe(false);
    expect(isValidDateString('2024/01/15')).toBe(false);
    expect(isValidDateString('2024-1-15')).toBe(false);
    expect(isValidDateString('')).toBe(false);
  });

  it('should reject invalid dates', () => {
    expect(isValidDateString('2024-13-01')).toBe(false); // invalid month
    expect(isValidDateString('2024-00-15')).toBe(false); // invalid month
    expect(isValidDateString('2024-02-30')).toBe(false); // invalid day for Feb
    expect(isValidDateString('2023-02-29')).toBe(false); // not leap year
  });
});

// ============================================
// compareDateStrings Tests
// ============================================
describe('compareDateStrings', () => {
  it('should return -1 when a < b', () => {
    expect(compareDateStrings('2024-01-01', '2024-01-02')).toBe(-1);
    expect(compareDateStrings('2023-12-31', '2024-01-01')).toBe(-1);
  });

  it('should return 0 when a === b', () => {
    expect(compareDateStrings('2024-01-15', '2024-01-15')).toBe(0);
  });

  it('should return 1 when a > b', () => {
    expect(compareDateStrings('2024-01-02', '2024-01-01')).toBe(1);
    expect(compareDateStrings('2024-01-01', '2023-12-31')).toBe(1);
  });
});

// ============================================
// addDays Tests
// ============================================
describe('addDays', () => {
  it('should add positive days', () => {
    expect(addDays('2024-01-15', 1)).toBe('2024-01-16');
    expect(addDays('2024-01-15', 10)).toBe('2024-01-25');
  });

  it('should handle month overflow', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
  });

  it('should subtract days with negative value', () => {
    expect(addDays('2024-01-15', -1)).toBe('2024-01-14');
    expect(addDays('2024-01-01', -1)).toBe('2023-12-31');
  });
});

// ============================================
// getDayOfWeek Tests
// ============================================
describe('getDayOfWeek', () => {
  // 2024-01-15 is Monday
  it('should return correct day of week (0=Sun, 6=Sat)', () => {
    expect(getDayOfWeek('2024-01-14')).toBe(0); // Sunday
    expect(getDayOfWeek('2024-01-15')).toBe(1); // Monday
    expect(getDayOfWeek('2024-01-16')).toBe(2); // Tuesday
    expect(getDayOfWeek('2024-01-20')).toBe(6); // Saturday
  });
});

// ============================================
// jsWeekdayToKorIndex Tests
// ============================================
describe('jsWeekdayToKorIndex', () => {
  it('should convert JS weekday to Korean index', () => {
    expect(jsWeekdayToKorIndex(0)).toBe(6); // Sunday → 일 (index 6)
    expect(jsWeekdayToKorIndex(1)).toBe(0); // Monday → 월 (index 0)
    expect(jsWeekdayToKorIndex(2)).toBe(1); // Tuesday → 화 (index 1)
    expect(jsWeekdayToKorIndex(6)).toBe(5); // Saturday → 토 (index 5)
  });
});

// ============================================
// isDateInWeekdays Tests
// ============================================
describe('isDateInWeekdays', () => {
  // 2024-01-15 is Monday (월)
  it('should return true when date matches weekday', () => {
    expect(isDateInWeekdays('2024-01-15', ['월'])).toBe(true);
    expect(isDateInWeekdays('2024-01-15', ['월', '수', '금'])).toBe(true);
  });

  it('should return false when date does not match weekday', () => {
    expect(isDateInWeekdays('2024-01-15', ['화'])).toBe(false);
    expect(isDateInWeekdays('2024-01-15', ['토', '일'])).toBe(false);
  });

  it('should work for all weekdays', () => {
    // Week of Jan 15-21, 2024
    expect(isDateInWeekdays('2024-01-14', ['일'])).toBe(true); // Sunday
    expect(isDateInWeekdays('2024-01-15', ['월'])).toBe(true); // Monday
    expect(isDateInWeekdays('2024-01-16', ['화'])).toBe(true); // Tuesday
    expect(isDateInWeekdays('2024-01-17', ['수'])).toBe(true); // Wednesday
    expect(isDateInWeekdays('2024-01-18', ['목'])).toBe(true); // Thursday
    expect(isDateInWeekdays('2024-01-19', ['금'])).toBe(true); // Friday
    expect(isDateInWeekdays('2024-01-20', ['토'])).toBe(true); // Saturday
  });
});
