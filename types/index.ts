// types/index.ts

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
  active: boolean;
  flowSteps: FlowStep[];
}

export type TaskColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
export type Frequency = 'daily' | 'weekly' | 'custom';

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
