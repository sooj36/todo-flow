// lib/schema/templates.test.ts
// Phase 14.1: 스키마 밸리데이션 유닛 테스트

import { describe, it, expect } from 'vitest';
import {
  TaskColorSchema,
  IconSchema,
  FrequencySchema,
  WeekdaySchema,
  RepeatOptionsSchema,
  FlowStepInputSchema,
  FlowStepsInputSchema,
  CreateTaskTemplateSchema,
  TASK_COLORS,
  ALLOWED_LUCIDE_ICONS,
  DEFAULT_ICON,
  DEFAULT_COLOR,
  isValidColor,
  isValidIcon,
  validateRepeatOptions,
  assignStepOrders,
} from './templates';

// ============================================
// TaskColor Whitelist Tests
// ============================================
describe('TaskColorSchema', () => {
  it('should accept all valid colors', () => {
    TASK_COLORS.forEach((color) => {
      const result = TaskColorSchema.safeParse(color);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid colors', () => {
    const invalidColors = ['orange', 'pink', 'BLACK', 'Blue', '', null, undefined, 123];
    invalidColors.forEach((color) => {
      const result = TaskColorSchema.safeParse(color);
      expect(result.success).toBe(false);
    });
  });

  it('isValidColor helper should work correctly', () => {
    expect(isValidColor('blue')).toBe(true);
    expect(isValidColor('gray')).toBe(true);
    expect(isValidColor('orange')).toBe(false);
    expect(isValidColor('')).toBe(false);
  });
});

// ============================================
// Icon Whitelist Tests
// ============================================
describe('IconSchema', () => {
  it('should accept valid Lucide icon names', () => {
    const testIcons = ['zap', 'cpu', 'calendar', 'workflow', 'star'];
    testIcons.forEach((icon) => {
      const result = IconSchema.safeParse(icon);
      expect(result.success).toBe(true);
    });
  });

  it('should accept single emoji', () => {
    const validEmojis = ['📋', '✅', '🎯', '💡', '🚀'];
    validEmojis.forEach((emoji) => {
      const result = IconSchema.safeParse(emoji);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid icons', () => {
    const invalidIcons = [
      'invalid-icon-name',
      'CALENDAR', // case sensitive
      'abc', // not in list
      '📋📋', // multiple emojis
      'Hello', // text
      '', // empty
      123, // number
    ];
    invalidIcons.forEach((icon) => {
      const result = IconSchema.safeParse(icon);
      expect(result.success).toBe(false);
    });
  });

  it('isValidIcon helper should work correctly', () => {
    expect(isValidIcon('zap')).toBe(true);
    expect(isValidIcon('📋')).toBe(true);
    expect(isValidIcon('invalid')).toBe(false);
  });
});

// ============================================
// Frequency Schema Tests
// ============================================
describe('FrequencySchema', () => {
  it('should accept valid frequencies', () => {
    const valid = ['daily', 'weekly', 'custom'];
    valid.forEach((freq) => {
      const result = FrequencySchema.safeParse(freq);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid frequencies', () => {
    const invalid = ['monthly', 'yearly', 'DAILY', '', null];
    invalid.forEach((freq) => {
      const result = FrequencySchema.safeParse(freq);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// Weekday Schema Tests
// ============================================
describe('WeekdaySchema', () => {
  it('should accept valid Korean weekdays', () => {
    const valid = ['월', '화', '수', '목', '금', '토', '일'];
    valid.forEach((day) => {
      const result = WeekdaySchema.safeParse(day);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid weekdays', () => {
    const invalid = ['Mon', 'Monday', '월요일', '', null];
    invalid.forEach((day) => {
      const result = WeekdaySchema.safeParse(day);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// RepeatOptions Schema Tests
// ============================================
describe('RepeatOptionsSchema', () => {
  it('should accept valid daily repeat options', () => {
    const result = RepeatOptionsSchema.safeParse({
      frequency: 'daily',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid weekly repeat options', () => {
    const result = RepeatOptionsSchema.safeParse({
      frequency: 'weekly',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid custom repeat options with weekdays', () => {
    const result = RepeatOptionsSchema.safeParse({
      frequency: 'custom',
      weekdays: ['월', '수', '금'],
    });
    expect(result.success).toBe(true);
  });

  it('should accept repeat options with end date', () => {
    const result = RepeatOptionsSchema.safeParse({
      frequency: 'daily',
      repeatEnd: '2024-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('should accept repeat options with limit', () => {
    const result = RepeatOptionsSchema.safeParse({
      frequency: 'daily',
      repeatLimit: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should accept repeat options with both end date and limit', () => {
    const result = RepeatOptionsSchema.safeParse({
      frequency: 'weekly',
      repeatEnd: '2024-12-31',
      repeatLimit: 52,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid date format', () => {
    const result = RepeatOptionsSchema.safeParse({
      frequency: 'daily',
      repeatEnd: '2024/12/31',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative limit', () => {
    const result = RepeatOptionsSchema.safeParse({
      frequency: 'daily',
      repeatLimit: -5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject limit exceeding 365', () => {
    const result = RepeatOptionsSchema.safeParse({
      frequency: 'daily',
      repeatLimit: 400,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer limit', () => {
    const result = RepeatOptionsSchema.safeParse({
      frequency: 'daily',
      repeatLimit: 10.5,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// validateRepeatOptions Business Logic Tests
// ============================================
describe('validateRepeatOptions', () => {
  it('should validate daily frequency without weekdays', () => {
    const result = validateRepeatOptions({ frequency: 'daily' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require weekdays for custom frequency', () => {
    const result = validateRepeatOptions({ frequency: 'custom' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Custom frequency requires at least one weekday');
  });

  it('should validate custom frequency with weekdays', () => {
    const result = validateRepeatOptions({
      frequency: 'custom',
      weekdays: ['월', '화'],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject custom frequency with empty weekdays', () => {
    const result = validateRepeatOptions({
      frequency: 'custom',
      weekdays: [],
    });
    expect(result.valid).toBe(false);
  });
});

// ============================================
// FlowStep Input Schema Tests
// ============================================
describe('FlowStepInputSchema', () => {
  it('should accept valid step name', () => {
    const result = FlowStepInputSchema.safeParse({ name: 'Step 1' });
    expect(result.success).toBe(true);
  });

  it('should reject empty step name', () => {
    const result = FlowStepInputSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject step name exceeding 100 characters', () => {
    const result = FlowStepInputSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('FlowStepsInputSchema', () => {
  it('should accept valid steps array', () => {
    const result = FlowStepsInputSchema.safeParse([
      { name: 'Step 1' },
      { name: 'Step 2' },
      { name: 'Step 3' },
    ]);
    expect(result.success).toBe(true);
  });

  it('should accept empty steps array', () => {
    const result = FlowStepsInputSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('should reject more than 20 steps', () => {
    const steps = Array.from({ length: 21 }, (_, i) => ({ name: `Step ${i + 1}` }));
    const result = FlowStepsInputSchema.safeParse(steps);
    expect(result.success).toBe(false);
  });
});

describe('assignStepOrders', () => {
  it('should assign orders starting from 1', () => {
    const steps = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    const result = assignStepOrders(steps);
    expect(result).toEqual([
      { name: 'A', order: 1 },
      { name: 'B', order: 2 },
      { name: 'C', order: 3 },
    ]);
  });

  it('should handle empty array', () => {
    const result = assignStepOrders([]);
    expect(result).toEqual([]);
  });

  it('should handle single step', () => {
    const result = assignStepOrders([{ name: 'Only' }]);
    expect(result).toEqual([{ name: 'Only', order: 1 }]);
  });
});

// ============================================
// CreateTaskTemplate Schema Tests
// ============================================
describe('CreateTaskTemplateSchema', () => {
  it('should accept valid minimal input', () => {
    const result = CreateTaskTemplateSchema.safeParse({
      name: 'My Task',
      instanceDate: '2024-01-15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.icon).toBe(DEFAULT_ICON);
      expect(result.data.color).toBe(DEFAULT_COLOR);
      expect(result.data.isRepeating).toBe(false);
      expect(result.data.steps).toEqual([]);
    }
  });

  it('should accept full input with all fields', () => {
    const result = CreateTaskTemplateSchema.safeParse({
      name: 'My Full Task',
      icon: '🎯',
      color: 'blue',
      isRepeating: true,
      repeatOptions: {
        frequency: 'weekly',
        repeatEnd: '2024-12-31',
      },
      steps: [{ name: 'Step 1' }, { name: 'Step 2' }],
      instanceDate: '2024-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = CreateTaskTemplateSchema.safeParse({
      name: '',
      instanceDate: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing instanceDate', () => {
    const result = CreateTaskTemplateSchema.safeParse({
      name: 'My Task',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid date format', () => {
    const result = CreateTaskTemplateSchema.safeParse({
      name: 'My Task',
      instanceDate: '01-15-2024',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid color', () => {
    const result = CreateTaskTemplateSchema.safeParse({
      name: 'My Task',
      color: 'orange',
      instanceDate: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid icon', () => {
    const result = CreateTaskTemplateSchema.safeParse({
      name: 'My Task',
      icon: 'invalid-icon',
      instanceDate: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('should use Lucide icon name', () => {
    const result = CreateTaskTemplateSchema.safeParse({
      name: 'My Task',
      icon: 'calendar',
      instanceDate: '2024-01-15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.icon).toBe('calendar');
    }
  });
});
