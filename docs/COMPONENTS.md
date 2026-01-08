# Component Specifications
// 컴포넌트 상세 spec - ui/ux 구현 시 참조

## Layout Components

### Sidebar

```
위치: components/layout/Sidebar.tsx
역할: 좌측 네비게이션
```

- 로고 + 앱 이름
- 네비게이션 아이템 (NavItem 사용)
- 하단 사용자 정보

### NavItem

```
위치: components/layout/NavItem.tsx
Props: { icon, label, active?, href? }
```

---

## Calendar Components

### NotionCalendar

```
위치: components/calendar/NotionCalendar.tsx
역할: 월간 캘린더 (2-Phase 분할)
Props: { year, month, calendarData }
```

**특징:**
- Phase 01 (1-15일), Phase 02 (16-말일)
- 날짜별 완료 Task 수에 따른 시각적 채움도
- 오늘 날짜 하이라이트

### CalendarDay

```
위치: components/calendar/CalendarDay.tsx
Props: { day, date, tasks, isToday? }
```

**시각적 표현:**
- 빈 날: 연한 배경
- 일부 완료: 중간 채움
- 전체 완료: 진한 채움 + 체크 아이콘

---

## Flow Components

### FlowBoard

```
위치: components/flow/FlowBoard.tsx
역할: 오늘의 Task Instance 관리
Props: { instances, onStatusChange, onStepComplete }
```

**레이아웃:**
- 헤더: 오늘 날짜 + "오늘 Task 생성" 버튼
- 본문: TaskCard 리스트 (Todo → Doing → Done 순)
- 완료된 Task는 하단 별도 섹션

### TaskCard

```
위치: components/flow/TaskCard.tsx
Props: { instance, onStepComplete, onStatusChange }
```

**구성:**
- 헤더: 아이콘 + Task명 + 상태 뱃지
- 본문: SubFlowChecklist
- 푸터: 진행률 바

### SubFlowChecklist

```
위치: components/flow/SubFlowChecklist.tsx
Props: { steps, completedStepIds, onStepToggle }
```

- 체크박스 리스트
- 완료된 스텝은 strikethrough + muted color

---

## Modal Components

### CreateTodayTaskModal

```
위치: components/modals/CreateTodayTaskModal.tsx
Props: { isOpen, onClose, templates, onCreateTasks }
```

**플로우:**
1. 활성화된 템플릿 목록 체크박스로 표시
2. 전체 선택/해제 버튼
3. "오늘 Task 생성" 버튼 → 선택된 템플릿으로 Instance 생성

---

## UI Components

### Button

```
위치: components/ui/Button.tsx
Props: { variant, size, disabled, onClick, children }
Variants: primary, secondary, ghost
```

### Badge

```
위치: components/ui/Badge.tsx
Props: { variant, children }
Variants: todo, doing, done (status colors)
```

### ProgressBar

```
위치: components/ui/ProgressBar.tsx
Props: { current, total, color? }
```

---

## Hooks

### useTaskTemplates

```typescript
// hooks/useTaskTemplates.ts
const { templates, isLoading } = useTaskTemplates();
```

### useTaskInstances

```typescript
// hooks/useTaskInstances.ts
const { 
  instances, 
  createInstances, 
  updateStatus, 
  completeStep 
} = useTaskInstances(date);
```

### useCalendarData

```typescript
// hooks/useCalendarData.ts
const { calendarData, isLoading } = useCalendarData(year, month);
```

---

## Color Palette

```typescript
const colors = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
};
```

---

## Status Styles

```typescript
const statusStyles = {
  todo: { bg: 'bg-gray-100', text: 'text-gray-600' },
  doing: { bg: 'bg-blue-100', text: 'text-blue-600' },
  done: { bg: 'bg-green-100', text: 'text-green-600' },
};
```
