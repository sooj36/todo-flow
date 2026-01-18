// lib/schema/templates.ts
// Phase 14.1: 템플릿 생성용 Zod 스키마 (프런트/백 공유)

import { z } from 'zod';

// ============================================
// TaskColor Whitelist
// ============================================
export const TASK_COLORS = ['blue', 'green', 'yellow', 'red', 'purple', 'gray'] as const;
export const TaskColorSchema = z.enum(TASK_COLORS);
export type TaskColor = z.infer<typeof TaskColorSchema>;

// ============================================
// Icon Whitelist (Lucide icon names + 이모지)
// ============================================
// 허용된 Lucide 아이콘 이름
export const ALLOWED_LUCIDE_ICONS = [
  'zap',
  'cpu',
  'briefcase',
  'database',
  'search',
  'settings',
  'layout',
  'calendar',
  'workflow',
  'bell',
  'check-circle',
  'circle',
  'square',
  'star',
  'heart',
  'flag',
  'bookmark',
  'folder',
  'file',
  'file-text',
  'edit',
  'trash',
  'plus',
  'minus',
  'x',
  'arrow-right',
  'arrow-left',
  'chevron-right',
  'chevron-left',
  'user',
  'users',
  'home',
  'mail',
  'phone',
  'clock',
  'alarm-clock',
  'timer',
  'target',
  'trophy',
  'medal',
  'gift',
  'coffee',
  'sun',
  'moon',
  'cloud',
  'umbrella',
  'music',
  'camera',
  'image',
  'video',
  'mic',
  'headphones',
  'book',
  'notebook',
  'pen',
  'pencil',
  'brush',
  'palette',
  'code',
  'terminal',
  'globe',
  'map',
  'navigation',
  'plane',
  'car',
  'bike',
  'ship',
  'rocket',
  'lightbulb',
  'key',
  'lock',
  'unlock',
  'shield',
  'credit-card',
  'wallet',
  'shopping-cart',
  'shopping-bag',
  'box',
  'package',
  'truck',
  'building',
  'store',
  'hospital',
  'school',
  'graduation-cap',
  'dumbbell',
  'heart-pulse',
  'pill',
  'stethoscope',
  'utensils',
  'pizza',
  'apple',
  'leaf',
  'tree',
  'flower',
  'flame',
  'droplet',
  'sparkles',
] as const;

// 이모지 정규식 (기본 이모지 패턴)
const EMOJI_REGEX = /^[\p{Emoji}]$/u;

// Icon 스키마: Lucide 아이콘 이름 또는 단일 이모지
export const IconSchema = z.string().refine(
  (val) => {
    // Lucide 아이콘 이름 허용
    if (ALLOWED_LUCIDE_ICONS.includes(val as typeof ALLOWED_LUCIDE_ICONS[number])) {
      return true;
    }
    // 단일 이모지 허용 (다중 이모지나 텍스트 거부)
    if (EMOJI_REGEX.test(val)) {
      return true;
    }
    return false;
  },
  {
    message: 'Icon must be a valid Lucide icon name or a single emoji',
  }
);

// 기본값 상수
export const DEFAULT_ICON = '📋';
export const DEFAULT_COLOR: TaskColor = 'gray';

// ============================================
// Frequency & Repeat Options
// ============================================
export const FREQUENCIES = ['daily', 'weekly', 'custom'] as const;
export const FrequencySchema = z.enum(FREQUENCIES);
export type Frequency = z.infer<typeof FrequencySchema>;

// 요일 (Notion multi-select 용)
export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;
export const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const WeekdaySchema = z.enum(WEEKDAYS);
export const WeekdayEnSchema = z.enum(WEEKDAYS_EN);
export type Weekday = z.infer<typeof WeekdaySchema>;
export type WeekdayEn = z.infer<typeof WeekdayEnSchema>;

// 날짜 포맷 정규식 (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 날짜 문자열이 실제로 유효한 날짜인지 검사 (포맷 + 실존 여부)
 * 예: 2024-02-30 → false (2월 30일 없음)
 */
export function isValidDateString(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) {
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

// 유효한 날짜 스키마 (포맷 + 실존 여부 검사)
const ValidDateSchema = z.string()
  .regex(DATE_REGEX, 'Date must be in YYYY-MM-DD format')
  .refine(isValidDateString, {
    message: 'Invalid date (e.g., 2024-02-30 does not exist)',
  });

// 반복 옵션 스키마 (비즈니스 규칙 포함)
export const RepeatOptionsSchema = z.object({
  frequency: FrequencySchema,
  weekdays: z.array(WeekdaySchema).optional(), // custom frequency일 때 사용
  repeatEnd: ValidDateSchema.optional(), // 반복 종료일 (optional)
  repeatLimit: z.number()
    .int('Must be an integer')
    .positive('Must be positive')
    .max(365, 'Cannot exceed 365')
    .optional(), // 반복 횟수 제한 (optional)
}).refine(
  (data) => {
    // custom frequency일 때 weekdays 필수
    if (data.frequency === 'custom') {
      return data.weekdays && data.weekdays.length > 0;
    }
    return true;
  },
  {
    message: 'Custom frequency requires at least one weekday',
    path: ['weekdays'],
  }
);

export type RepeatOptions = z.infer<typeof RepeatOptionsSchema>;

// ============================================
// FlowStep Input Schema (생성 시 입력용)
// ============================================
// 생성 시에는 id, parentTemplateId, order를 서버에서 할당
export const FlowStepInputSchema = z.object({
  name: z.string()
    .min(1, 'Step name is required')
    .max(100, 'Step name cannot exceed 100 characters'),
});

export type FlowStepInput = z.infer<typeof FlowStepInputSchema>;

// FlowStep 배열 스키마 (order 자동 할당 검증 포함)
export const FlowStepsInputSchema = z.array(FlowStepInputSchema)
  .max(20, 'Cannot have more than 20 steps');

// order 자동 할당 헬퍼 함수
export function assignStepOrders<T extends { name: string }>(steps: T[]): Array<T & { order: number }> {
  return steps.map((step, index) => ({
    ...step,
    order: index + 1, // 1-based index
  }));
}

// ============================================
// TaskTemplate Creation Schema (API 요청용)
// ============================================
export const CreateTaskTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(100, 'Template name cannot exceed 100 characters'),

  icon: IconSchema.default(DEFAULT_ICON),

  color: TaskColorSchema.default(DEFAULT_COLOR),

  isRepeating: z.boolean().default(false),

  // 반복 옵션 (isRepeating=true일 때 필수)
  repeatOptions: RepeatOptionsSchema.optional(),

  // FlowStep 입력 (순서대로 order 1..n 자동 할당)
  steps: FlowStepsInputSchema.default([]),

  // 인스턴스 생성 날짜 (YYYY-MM-DD 로컬 기준, 실존 여부 검사 포함)
  instanceDate: ValidDateSchema,
}).superRefine((data, ctx) => {
  // isRepeating=true일 때 repeatOptions 필수
  if (data.isRepeating && !data.repeatOptions) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'repeatOptions is required when isRepeating is true',
      path: ['repeatOptions'],
    });
  }
});

export type CreateTaskTemplateInput = z.infer<typeof CreateTaskTemplateSchema>;

// ============================================
// API Response Schema
// ============================================
export const CreateTaskResponseSchema = z.object({
  templateId: z.string(),
  stepIds: z.array(z.string()),
  instanceId: z.string(),
  // 부분 실패 시 정리된 ID 목록
  cleanupIds: z.array(z.string()).optional(),
  partialCleanup: z.boolean().optional(),
});

export type CreateTaskResponse = z.infer<typeof CreateTaskResponseSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * 색상 값이 유효한지 검사
 */
export function isValidColor(color: string): color is TaskColor {
  return TASK_COLORS.includes(color as TaskColor);
}

/**
 * 아이콘 값이 유효한지 검사
 */
export function isValidIcon(icon: string): boolean {
  const result = IconSchema.safeParse(icon);
  return result.success;
}

/**
 * 반복 옵션 유효성 검사 (프로그래매틱 사용용)
 * 참고: RepeatOptionsSchema가 이미 .refine()으로 동일 규칙을 적용함
 * @deprecated 스키마 검증 사용 권장: RepeatOptionsSchema.safeParse()
 */
export function validateRepeatOptions(options: RepeatOptions): { valid: boolean; errors: string[] } {
  const result = RepeatOptionsSchema.safeParse(options);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  // Zod 4.x uses 'issues' instead of 'errors'
  return {
    valid: false,
    errors: result.error.issues.map(e => e.message),
  };
}
