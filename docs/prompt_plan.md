# prompt_plan.md - Implementation Roadmap Checklist

## Instructions for AI
- Read @spec.md, @prd.md first.
- Execute tasks sequentially. After each, verify with tests (pnpm lint, pnpm test).
- If unclear, ask questions in [ ] format.
- Mark done with [x], update this file.
- TDD: Write test → implement → pass. Phase 8 리팩토링에서는 테스트 삭제 금지 (임시 테스트는 별도 파일로 격리 후 유지).
- Commit rule: Before deleting tests, commit changes.
- Log rule: Record test results in docs/log.md (e.g., "TaskCard.test.tsx: 진행률 바 렌더링 통과 – 2026-01-07").
- Tooling: Use Vitest for tests.
- Phase 3: Keep integration tests for stability ("Keep CI green").
- 테스트 정합성: 리팩토링 작업에서는 임시 테스트 삭제 금지. 필요한 경우 별도 파일로 격리 후 유지.
- 리팩토링 검증: 분리 단계마다 기존 테스트 + 핵심 인터랙션 1건 이상 유지 (노드 토글, 동기화 버튼 등).

## Doc Reading Guide
- Default order: prompt_plan.md → spec.md → PRD.md → COMPONENTS.md → DATA_MODEL.md → log.md
- Skip files that are not relevant to the current task.

## Phase 10 Tasks (Calendar-Flow Date Synchronization)
- 목표: Calendar 날짜 변경 시 Flow도 동일한 날짜의 데이터 표시 (selectedDate 공유)
- 파일: app/page.tsx, components/calendar/NotionCalendar.tsx, components/flow/FlowBoard.tsx, hooks/useTaskInstances.ts
- 원칙: Lift state up → Props drilling → 양방향 동기화

### 10.1 Make NotionCalendar Controllable
- [ ] props interface 추가 (selectedDate, onDateChange)
- [ ] controlled/uncontrolled mode 지원
- [ ] navigation handlers에서 onDateChange 호출
- [ ] standalone 사용 시 backward compatibility 확인
- [ ] 커밋: feat: make NotionCalendar date controllable

### 10.2 Make FlowBoard Date-Aware
- [ ] selectedDate prop interface 추가
- [ ] hardcoded `today` 제거, prop 사용
- [ ] useTaskInstances 호출에 date string 전달
- [ ] 다양한 날짜로 수동 테스트
- [ ] 커밋: feat: make FlowBoard date-aware

### 10.3 Sync via page.tsx
- [ ] page.tsx를 client component로 변환 ('use client')
- [ ] selectedDate state 추가
- [ ] NotionCalendar에 props 전달
- [ ] FlowBoard에 props 전달
- [ ] 양방향 동기화 동작 확인
- [ ] 커밋: feat: sync Calendar-Flow with shared date state

### 10.4 Update useTaskInstances Hook
- [ ] optional date parameter 추가
- [ ] API URL에 date query param 포함
- [ ] 다양한 날짜로 테스트
- [ ] 커밋: refactor: support date param in useTaskInstances

### 10.5 Testing & Verification
- [ ] Manual: 어제로 이동 → 양쪽 모두 업데이트
- [ ] Manual: 다음 달로 이동 → 양쪽 모두 업데이트
- [ ] Manual: TODAY 버튼 → 양쪽 모두 리셋
- [ ] Manual: 빈 날짜 처리 확인
- [ ] Automated: integration test (optional)
- [ ] 커밋: test: verify Calendar-Flow date sync

### 10.6 Final Verification
- [ ] End-to-end 네비게이션 플로우 동작 확인
- [ ] Console 에러 없음
- [ ] 성능 체크 (불필요한 리렌더링 없음)
- [ ] pnpm lint, pnpm test 통과
- [ ] 커밋: docs: mark Phase 10 complete

## Future Extension: Agentic AI (Auto Triage)
- 목표: 캘린더/인스턴스 데이터를 보고 일정 충돌/미완료를 자동 조정
- 계획: 우선순위 재배치/연기/분할 계획 생성
- 도구 실행: Notion DB 업데이트
- 검증: 업데이트 결과 요약/재시도
- UI: "자동 정리(Agent)" 버튼 + 실행 로그 패널

## Future Extension Prerequisites
- 데이터 정합성: Instance에 priority/estimate 같은 판단 기준 확정
- Notion 업데이트 API: 일정/상태 변경 PATCH 라우트 준비
- 규칙 정의: "충돌"과 "미완료" 기준 문서화
- 실행 로그 구조: 단계별 결과/에러 기록 방식 결정
- 안전장치: 드라이런/되돌리기/재시도 정책

## Verification Loop
- After task: "Keep CI green" – run tests, commit. (TDD: 테스트 작성 → 실행 → 통과 확인 후에만 commit.)
- Phase 8: 전체 테스트 대신 API 테스트만 실행 (pnpm test:run app/api/notion)
- If error: Analyze, fix, update this file. (Codex로 commit 평가 후, 수정 사항 적용.)
- 코드 작성 전 브랜치명을 확인해서 (feature, test, design) 구분해서 할 것  
    ex)feature/layout-resize
- 브랜치 checkout이 필요한 경우, 현재 브랜치 commit -> push -> PR 생성/병합 완료해서 브랜치 코드간 연동되도록 할 것.
- PR 전에 git pull로 최신 상태 확인하고, 충돌 해결하세요.
- 커밋 메시지에 이모지 기입하지 말것. (
    Conventional Commits 스타일 추천: feat: description)
- 단위 작업이 끝나면 반드시 커밋 작업까지 완료할 것. 완료 후 커밋 아이디 결과 알려줄 것.
- TDD 추가: Test code 필수적으로 작성하되, 완료 후 지우지 말고 유지할 것. (임시 테스트라면 별도 파일로 격리.)
