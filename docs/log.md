# log.md

## 테스트 결과
- NotionCalendar.test.tsx: 현재 월/Phase/일자 렌더링 통과 (데이터 연동 포함) – 2026-01-07
- FlowBoard.test.tsx: 연결 전 상태 UI 렌더링 통과 – 2026-01-07
- NotionConnectionModal.test.tsx: 연결 입력 검증 통과 – 2026-01-07
- app/api/notion/templates/route.test.ts: GET /api/notion/templates (3 tests) 통과, 에러 메시지 구체화 – 2026-01-07
- app/api/notion/flow-steps/route.test.ts: GET /api/notion/flow-steps (4 tests) 통과, 에러 메시지 구체화 – 2026-01-07
- app/api/notion/instances/route.test.ts: GET, POST /api/notion/instances (9 tests) 통과, 에러 메시지 구체화 – 2026-01-07
- hooks/useTaskTemplates.test.ts: useTaskTemplates hook (2 tests) 통과 – 2026-01-07
- hooks/useTaskInstances.test.ts: useTaskInstances hook (3 tests) 통과 – 2026-01-07

## 작업 방식 기록
- 병렬 작업 사용: dev 서버 + test watch를 서브프로세스로 분리해 진행 – 2026-01-07

## Phase 3 작업 기록
- useTaskTemplates, useTaskInstances hooks 구현 (TDD 방식) – 2026-01-07
- NotionCalendar에 데이터 로딩/에러/빈 상태 추가 – 2026-01-07
- NotionCalendar에 실제 데이터 렌더링 (진행률 바, 완료율 표시) – 2026-01-07
- API route 에러 메시지 구체화 (누락된 환경 변수 정확히 표시) – 2026-01-07
