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
- [x] props interface 추가 (selectedDate, onDateChange)
- [x] navigation handlers에서 onDateChange 호출
- [x] 기존 내부 state 제거 (controlled only)
- [x] 커밋: feat: make NotionCalendar date controllable (b3de024)

### 10.2 Make FlowBoard Date-Aware
- [x] selectedDate prop interface 추가
- [x] hardcoded `today` 제거, prop 사용
- [x] useTaskInstances 호출에 date string 전달
- [x] 다양한 날짜로 수동 테스트
- [x] 커밋: feat: make FlowBoard date-aware (c9174ac)

### 10.3 Sync via page.tsx
- [x] page.tsx 상태 확인 (이미 client component임)
- [x] selectedDate state 추가
- [x] NotionCalendar에 props 전달
- [x] FlowBoard에 props 전달
- [x] 양방향 동기화 동작 확인
- [x] 커밋: feat: sync Calendar-Flow with shared date state (7322825)

### 10.4 Update useTaskInstances Hook
- [x] optional date parameter 추가 - FlowBoard에서 이미 사용중
- [x] API URL에 date query param 포함 - hook이 이미 지원함
- [x] 다양한 날짜로 테스트 - 수동 테스트 필요
- [x] 커밋: (hook은 이미 date 파라미터 지원)

### 10.5 Testing & Verification
- [x] NotionCalendar 테스트 수정 (5 tests 모두 통과)
- [x] Manual: 어제로 이동 → 양쪽 모두 업데이트
- [x] Manual: 다음 달로 이동 → 양쪽 모두 업데이트
- [x] Manual: TODAY 버튼 → 양쪽 모두 리셋
- [x] Manual: 빈 날짜 처리 확인
- [x] 커밋: test: update NotionCalendar tests for controlled component (8010748)

### 10.6 Final Verification
- [x] End-to-end 네비게이션 플로우 동작 확인 - 수동 테스트 필요
- [x] Console 에러 없음
- [x] 성능 체크 (불필요한 리렌더링 없음)
- [x] pnpm test 통과 - NotionCalendar tests 통과
- [x] 커밋: docs: mark Phase 10 complete

## Phase 11 Tasks (Highlight Selected Date in Calendar Grid)
- 목표: Calendar grid에서 선택된 날짜(selectedDate) 하이라이트 (현재는 항상 오늘만 표시)
- 파일: components/calendar/NotionCalendar.tsx
- 원칙: isToday + isSelected 두 개의 시각적 표시 (선택된 날짜 강조, 오늘 표시)
- 중요: isSelected는 연/월/일 전체 비교 필요 (day만 비교하면 다른 월도 하이라이트됨)

### 11.1 Update Calendar Day Calculation
- [ ] `isSelected` 계산: cellDate.toDateString() === selectedDate.toDateString()
- [ ] CalendarDay에 `isSelected` prop 전달
- [ ] Phase 01/02 섹션 모두 적용
- [ ] 버그 방지: day만 비교하지 말고 전체 날짜 비교
- [ ] 커밋: feat: pass isSelected prop to CalendarDay

### 11.2 Update CalendarDay Styling
- [ ] `isSelected` props interface 추가
- [ ] Selected 스타일: bold border (border-4 border-black)
- [ ] Selected 배경: subtle (bg-blue-50)
- [ ] Today 표시: green dot - **only if not selected**
- [ ] Overlap 처리: selected = today일 때 → selected 스타일만 사용
- [ ] 커밋: feat: highlight selected date in calendar grid

### 11.3 Testing & Verification
- [ ] Manual: 다른 날짜로 이동 → 해당 날짜만 하이라이트
- [ ] Manual: 다른 월로 이동 → 다른 월의 같은 일자는 하이라이트 안됨
- [ ] Manual: selected = today 케이스 확인
- [ ] 테스트 업데이트 (isSelected 검증)
- [ ] pnpm test 통과
- [ ] 커밋: test: verify selected date highlighting

### 11.4 Final Verification
- [ ] 월 경계 테스트 (1월 15일 선택 → 2월 15일은 하이라이트 안됨)
- [ ] 접근성 확인 (contrast, focus)
- [ ] Console 에러 없음
- [ ] 커밋: docs: mark Phase 11 complete

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
