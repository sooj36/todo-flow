# spec.md - Flow Planner Detailed Specification

## Vision & Features
- PRD.md 참조: 반복 Task 시각화, Notion API 연동.
- 추가: Phase 1은 UI/빈 상태 정리, Phase 2는 Notion 연결/클라이언트 구성, Phase 3는 데이터 바인딩 및 E2E 테스트.

## Architecture
- Next.js App Router, TypeScript strict.
- Data Flow: useTaskTemplates → useTaskInstances (hooks).
- Tradeoffs: Tailwind vs. CSS modules → Tailwind for speed.

## UI/UX Details
- Calendar: Phase 분할 (1-15, 16-말일), 채움도 기반 하이라이트.
- FlowBoard: Drag-and-drop (Phase 2 확장).
- 연동 전 상태: 캘린더/보드 모두 빈 상태 표시.

## Constraints
- No any types, Tailwind only.
- MVP: No cron, no multi-user.

## References
@PRD.md @DATA_MODEL.md @COMPONENTS.md
