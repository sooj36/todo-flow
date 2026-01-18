// lib/utils/dateTransform.ts
// Phase 14.1: 날짜/타임존 변환 유틸리티
// 정책: 캘린더 클릭 로컬 날짜 → API payload `YYYY-MM-DD`(로컬 기준) → 서버에서 UTC 00:00으로 변환

/**
 * 로컬 Date 객체를 YYYY-MM-DD 문자열로 변환 (로컬 기준)
 * 캘린더 클릭 시 사용
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 문자열을 로컬 Date 객체로 파싱
 * 로컬 타임존의 00:00:00으로 설정
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * YYYY-MM-DD 문자열(로컬 기준)을 UTC 00:00:00 ISO 문자열로 변환
 * 서버에서 Notion Date 저장 시 사용
 *
 * @example
 * // 한국(KST, UTC+9)에서 2024-01-15 입력 시
 * // 반환: '2024-01-15T00:00:00.000Z' (UTC 기준)
 */
export function localDateToUTC(localDateStr: string): string {
  // 유효성 검사
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDateStr)) {
    throw new Error(`Invalid date format: ${localDateStr}. Expected YYYY-MM-DD`);
  }

  // YYYY-MM-DD를 UTC 00:00:00으로 직접 변환
  // Notion은 타임존 없는 date를 저장하므로, 입력된 날짜 그대로 UTC 00:00으로 저장
  return `${localDateStr}T00:00:00.000Z`;
}

/**
 * Notion Date (ISO 문자열 또는 YYYY-MM-DD)를 로컬 YYYY-MM-DD로 변환
 * Notion API 응답 파싱 시 사용
 */
export function notionDateToLocal(notionDate: string | null | undefined): string | null {
  if (!notionDate) {
    return null;
  }

  // YYYY-MM-DD 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(notionDate)) {
    return notionDate;
  }

  // ISO 형식이면 날짜 부분만 추출
  // 예: '2024-01-15T00:00:00.000Z' → '2024-01-15'
  if (notionDate.includes('T')) {
    return notionDate.split('T')[0];
  }

  return notionDate;
}

/**
 * 날짜 문자열 유효성 검사
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const [year, month, day] = dateStr.split('-').map(Number);

  // 기본 범위 검사
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;

  // Date 객체로 실제 유효성 검사
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * 두 날짜 문자열 비교 (YYYY-MM-DD 형식)
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareDateStrings(a: string, b: string): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (로컬 기준)
 */
export function getTodayString(): string {
  return formatLocalDate(new Date());
}

/**
 * 날짜에 일수를 더함
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseLocalDateString(dateStr);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

/**
 * 요일 인덱스 반환 (0=일, 1=월, ..., 6=토)
 */
export function getDayOfWeek(dateStr: string): number {
  const date = parseLocalDateString(dateStr);
  return date.getDay();
}

/**
 * 한국어 요일을 인덱스로 변환 (월=0, 화=1, ..., 일=6)
 */
const WEEKDAY_TO_INDEX: Record<string, number> = {
  '월': 0,
  '화': 1,
  '수': 2,
  '목': 3,
  '금': 4,
  '토': 5,
  '일': 6,
};

/**
 * JavaScript 요일(0=일요일)을 한국어 요일 인덱스(0=월요일)로 변환
 */
export function jsWeekdayToKorIndex(jsWeekday: number): number {
  // JS: 0=일, 1=월, ..., 6=토
  // KR: 0=월, 1=화, ..., 6=일
  return jsWeekday === 0 ? 6 : jsWeekday - 1;
}

/**
 * 특정 날짜가 주어진 요일 목록에 포함되는지 확인
 */
export function isDateInWeekdays(dateStr: string, weekdays: string[]): boolean {
  const jsWeekday = getDayOfWeek(dateStr);
  const korIndex = jsWeekdayToKorIndex(jsWeekday);
  const korWeekdays = ['월', '화', '수', '목', '금', '토', '일'];
  const dateWeekday = korWeekdays[korIndex];
  return weekdays.includes(dateWeekday);
}
