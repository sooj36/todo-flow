# prompt_plan.md - Implementation Roadmap Checklist

## Instructions for AI
- Read @spec.md, @prd.md first.
- Execute tasks sequentially. After each, verify with tests (pnpm lint, pnpm test).
- If unclear, ask questions in [ ] format.
- Mark done with [x], update this file.
- TDD: Write test → implement → pass → delete test. Core components (e.g., NotionCalendar, FlowBoard) keep tests.
- Commit rule: Before deleting tests, commit changes.
- Log rule: Record test results in docs/log.md (e.g., "TaskCard.test.tsx: 진행률 바 렌더링 통과 – 2026-01-07").
- Tooling: Use Vitest for tests.
- Phase 3: Keep integration tests for stability ("Keep CI green").

## Doc Reading Guide
- Default order: prompt_plan.md → spec.md → PRD.md → COMPONENTS.md → DATA_MODEL.md → log.md
- Skip files that are not relevant to the current task.


## Phase 2 Tasks

- [x] Notion 연결 입력 UI/검증 (API 키, DB IDs)
- [x] Notion API 클라이언트/라우트 구성

## Phase 3 Tasks

- [x] 캘린더 데이터 로딩/에러/빈 상태
- [x] FlowBoard 데이터 로딩/에러/빈 상태
- [x] 캘린더 이벤트 렌더링
- [x] FlowBoard 노드/상태 바인딩
- [x] 통합 테스트 구축 및 유지 (RTL 기반)

## Phase 4 Tasks (Personal Mode)
- [x] Notion 연결 값 저장 방식 확정 (개인용: localStorage 기반)
- [x] NotionConnectionModal onSave 연결 + 저장/불러오기
- [ ] 연결 상태 UI 반영 (저장된 값 존재 시 Connected)
- [ ] 저장값 초기화/재설정 플로우 추가


## Verification Loop
- After task: "Keep CI green" – run tests, commit.
- If error: Analyze, fix, update this file.
- 단위 작업이 끝나면 반드시 커밋 작업까지 완료할 것 . 완료 후 커밋 아이디 결과 알려줄 것.
