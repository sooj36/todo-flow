# Component Specifications

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
Props: 현재 없음
```

**특징:**
- Phase 01 (1-15일), Phase 02 (16-말일)
- 헤더에 현재 월 표시
- Notion 연결 전 상태 문구 표시

> Note: CalendarDay는 내부 구성으로 사용되며 별도 파일로 분리되어 있지 않음.

---

## Flow Components

### FlowBoard

```
위치: components/flow/FlowBoard.tsx
역할: Notion 연동 전/후 Flow 상태 UI
Props: 현재 없음
```

**레이아웃:**
- 상단: Notion 연결 상태/Sync 버튼
- 중앙: Flow 노드 레이아웃
- 하단: 데이터베이스 연결 요약

---

## Notion Components

### NotionConnectionModal

```
위치: components/notion/NotionConnectionModal.tsx
역할: Notion API 키/DB ID 입력 및 검증
Props: { isOpen, onClose, onSave? }
```

**검증 규칙:**
- API 키: secret_ 또는 ntn_ prefix
- DB ID: 32-char Notion ID (하이픈 허용)

---

## Tests

- components/calendar/NotionCalendar.test.tsx
- components/flow/FlowBoard.test.tsx
