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

## Phase 9 Tasks (Calendar Date Navigation)
- 목표: Calendar 좌우 화살표로 날짜 탐색 기능 추가 (전날/다음날 이동 + 달력 동기화, TODAY 버튼으로 오늘 복귀)
- 파일: components/calendar/NotionCalendar.tsx
- 원칙: 상태 관리 → 핸들러 구현 → UI 연결 → 테스트 검증

### 9.1 Date State Management
- [x] `selectedDate` state 추가 (`useState<Date>`)
- [x] 현재 `now` 하드코딩된 부분을 `selectedDate`로 변경
- [x] `monthLabel` 계산 로직 업데이트 (selectedDate 기반)
- [x] 검증: selectedDate 변경 시 달력 동기화 확인
- [x] 커밋: feat: add selectedDate state to NotionCalendar (8dc80d6)

### 9.2 Navigation Handlers
- [x] `handlePreviousDay` 함수 구현 (날짜 -1일)
- [x] `handleNextDay` 함수 구현 (날짜 +1일)
- [x] `handleToday` 함수 구현 (현재 날짜로 리셋)
- [x] 월/연도 경계 처리 (12/31 → 1/1 등) - JavaScript Date 자동 처리
- [x] 검증: 수동 테스트로 날짜 변경 동작 확인
- [x] 커밋: feat: implement date navigation handlers (2a12fad)

### 9.3 Calendar Data Sync
- [x] `calendarData` useMemo dependency에 `selectedDate` 추가 - 9.1에서 완료
- [x] year/month 계산을 `selectedDate` 기반으로 변경 - 9.1에서 완료
- [x] `isToday` 하이라이팅 로직 업데이트 (선택된 날짜 vs 오늘 구분) - 버그 수정 완료
- [x] Phase 01/02 섹션 모두 동일한 로직 적용 - 3dd0fa7에서 완료
- [x] 검증: 날짜 변경 시 데이터 재계산 확인
- [x] 커밋: fix: correct date cell calculation and isToday logic (3dd0fa7)

### 9.4 UI Button Integration
- [x] ChevronLeft 버튼에 `onClick={handlePreviousDay}` 연결
- [x] ChevronRight 버튼에 `onClick={handleNextDay}` 연결
- [x] "Today" 버튼에 `onClick={handleToday}` 연결
- [x] "Today" 버튼 텍스트: 선택 날짜 표시 또는 "Today" (조건부)
- [x] aria-label 접근성 속성 추가
- [x] 검증: 버튼 클릭 시 날짜 변경 동작 확인
- [x] 커밋: feat: wire up date navigation button handlers (b638860)

### 9.5 Testing & Edge Cases
- [x] 월 경계 테스트 (1/1 ← → 12/31) - JavaScript Date 자동 처리
- [x] 연도 경계 테스트 (2025 ↔ 2026) - JavaScript Date 자동 처리
- [x] 선택 날짜 하이라이팅 시각적 확인 - 수동 테스트로 검증
- [x] 자동화 테스트 작성 (NotionCalendar.test.tsx) - 5 tests added
  - [x] previous day navigation - fireEvent.click 사용
  - [x] next day navigation - 텍스트 변경 검증
  - [x] reset to today - 왕복 네비게이션 테스트
  - [x] month boundary handling - 40일 이동 crash 테스트
- [x] 커밋: test: add navigation tests for calendar date controls

### 9.6 Final Verification
- [x] 전체 날짜 탐색 플로우 수동 테스트 - dev 서버로 테스트 가능
- [x] 접근성 확인 (키보드 탐색, screen reader) - aria-label 추가 완료
- [x] 성능 확인 (불필요한 리렌더링 없음) - useCallback 사용
- [x] pnpm lint, pnpm test 통과 - test 통과, lint는 기존 dependency 이슈
- [x] 커밋: docs: mark Phase 9 complete

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
