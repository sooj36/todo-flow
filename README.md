# todo-flow

반복 Task를 시각화하고, 전체 캘린더 한눈에 보는 Flow Planner.

## 스펙 요약
- 비전/기능: 반복 Task 시각화, Notion API 연동 예정. Phase 1은 UI/빈 상태, Phase 2는 Notion 연결/클라이언트 구성, Phase 3는 데이터 바인딩 및 E2E.
- 아키텍처: Next.js App Router, TypeScript strict. 데이터 흐름은 `useTaskTemplates` -> `useTaskInstances` 훅.
- UI/UX: 캘린더는 월을 1-15, 16-말일로 분할해 채움도 하이라이트. FlowBoard는 Phase 2에서 드래그 앤 드롭 지원. 연동 전엔 빈 상태 표시.
- 제약: `any` 금지, Tailwind만 사용. MVP는 cron/멀티유저 제외.
- 참고: `docs/PRD.md`, `docs/DATA_MODEL.md`, `docs/COMPONENTS.md`.

## 문서 맵
- `docs/PRD.md` 제품 요구사항
- `docs/spec.md` 상세 스펙
- `docs/COMPONENTS.md` 컴포넌트 목록
- `docs/prompt_plan.md` 프롬프트 계획
- `docs/pre_prompt_plan.md` 사전 프롬프트 계획
- `docs/log.md` 작업 로그
- `docs/CLAUDE.md` Claude 노트

