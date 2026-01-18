// types/index.ts

// ============================================
// Re-export from Schema (Single Source of Truth)
// ============================================
export {
  // Constants
  TASK_COLORS,
  ALLOWED_LUCIDE_ICONS,
  FREQUENCIES,
  WEEKDAYS,
  WEEKDAYS_EN,
  DEFAULT_ICON,
  DEFAULT_COLOR,
  // Schemas
  TaskColorSchema,
  IconSchema,
  FrequencySchema,
  WeekdaySchema,
  WeekdayEnSchema,
  RepeatOptionsSchema,
  FlowStepInputSchema,
  FlowStepsInputSchema,
  CreateTaskTemplateSchema,
  CreateTaskResponseSchema,
  // Helpers
  isValidColor,
  isValidIcon,
  validateRepeatOptions,
  assignStepOrders,
  // Types (from Zod inference)
  type TaskColor,
  type Frequency,
  type Weekday,
  type WeekdayEn,
  type RepeatOptions,
  type FlowStepInput,
  type CreateTaskTemplateInput,
  type CreateTaskResponse,
} from '@/lib/schema/templates';

// ============================================
// Task Template - 반복 Task의 설계도
// ============================================
export interface TaskTemplate {
  id: string;
  name: string;
  icon: string;                    // 이모지 or lucide icon name
  color: TaskColor;
  isRepeating: boolean;
  defaultFrequency: Frequency;
  repeatOptions?: RepeatOptions;   // Phase 14: 반복 옵션 추가
  active: boolean;
  flowSteps: FlowStep[];
}

// ============================================
// Flow Step - Task 내부의 단계
// ============================================
export interface FlowStep {
  id: string;
  name: string;
  order: number;
  parentTemplateId: string;
  done: boolean;
}

// ============================================
// Task Instance - 특정 날짜에 생성된 실제 Task
// ============================================
export interface TaskInstance {
  id: string;
  templateId: string;
  template: TaskTemplate;
  date: string;                    // YYYY-MM-DD
  status: TaskStatus;
  currentStepId: string | null;
  completedStepIds: string[];
  createdAt: string;               // ISO datetime
  completedAt: string | null;
}

export type TaskStatus = 'todo' | 'doing' | 'done';

// ============================================
// Calendar Data
// ============================================
export interface CalendarDayData {
  date: string;                    // YYYY-MM-DD
  totalTasks: number;
  completedTasks: number;
  tasks: TaskInstance[];
}

export interface CalendarMonth {
  year: number;
  month: number;                   // 1-12
  days: CalendarDayData[];
}

// ============================================
// UI State
// ============================================
export interface CreateTaskModalState {
  isOpen: boolean;
  selectedTemplateIds: string[];
}

// ============================================
// Keyword Page - AI Agent용 키워드 추출 페이지
// ============================================
export interface KeywordPage {
  pageId: string;
  title: string;
  keywords: string[];
}
