# Data Model
// 타입과 DB 스키마 – Phase 2 Notion 연동을 위한 설계
// types/index.ts에 정의됨 (Phase 2에서 추가 완료)

## TypeScript Types

```typescript
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
  done?: boolean;
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
```

---

## Notion DB Schema

### Task Template DB

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Task 이름 |
| Icon | Rich Text | 이모지 또는 아이콘명 |
| Color | Select | blue, green, yellow, red, purple, gray |
| Is Repeating | Checkbox | 반복 여부 |
| Default Frequency | Select | daily, weekly, custom |
| Active | Checkbox | 활성화 여부 |

### FlowStep DB

| Property | Type | Description |
|----------|------|-------------|
| Step Name | Title | 단계 이름 |
| Order | Number | 순서 (1, 2, 3...) |
| Parent Template | Relation | → Task Template DB |
| done | Checkbox | 완료 여부 |

### Task Instance DB

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | 자동: "{Template명} - {날짜}" |
| Template | Relation | → Task Template DB |
| Date | Date | 생성 날짜 |
| Status | Select | todo, doing, done |
| Current Step | Relation | → FlowStep DB |
| Completed Steps | Relation (Multi) | → FlowStep DB |
| Completed At | Date | (Optional) 완료 시간 |

---

## Environment Variables

```env
# .env.local (Phase 2)
NOTION_API_KEY=secret_xxx
NOTION_TEMPLATE_DB_ID=xxx
NOTION_STEP_DB_ID=xxx
NOTION_INSTANCE_DB_ID=xxx
```
