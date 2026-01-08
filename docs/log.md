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
- NotionCalendar.test.tsx: 오늘 날짜 테두리 렌더링 통과 – 2026-01-07
- notionStorage.test.tsx: localStorage 저장/불러오기 통과 – 2026-01-07
- useNotionConnection.test.ts: 연결값 로드/저장 통과 – 2026-01-07
- NotionConnectionModal.test.tsx: 초기값 프리필/저장 콜백 통과 – 2026-01-07

## 작업 방식 기록
- 병렬 작업 사용: dev 서버 + test watch를 서브프로세스로 분리해 진행 – 2026-01-07

## Phase 3 작업 기록
- useTaskTemplates, useTaskInstances hooks 구현 (TDD 방식) – 2026-01-07
- NotionCalendar에 데이터 로딩/에러/빈 상태 추가 – 2026-01-07
- NotionCalendar에 실제 데이터 렌더링 (진행률 바, 완료율 표시) – 2026-01-07
- FlowBoard에 데이터 로딩/에러/빈 상태 추가 – 2026-01-07
- FlowBoard 노드를 실제 데이터와 바인딩 (템플릿별 task 표시) – 2026-01-07
- API route 에러 메시지 구체화 (누락된 환경 변수 정확히 표시) – 2026-01-07
- 모든 컴포넌트 테스트 통과 (23/23) – 2026-01-07

## 코드 리뷰 이슈 수정 (2026-01-07)
- High: GET /api/notion/instances에서 template 데이터 채우기 추가
- High: FlowBoard task 이름 매핑을 inst.template.name으로 수정
- Medium: 연결 상태 판단 로직 개선 (에러 유무로 판단)
- Medium: 빈 템플릿 상태 처리 및 fallback 메시지 추가
- Low: 타임존 이슈 해결 (getLocalDateString() 사용)
- 모든 테스트 업데이트 및 통과 확인

## Phase 3 완료: 통합 테스트 구축 (2026-01-07)
- app/__tests__/page.integration.test.tsx: Dashboard integration tests 구현 및 통과 (3 tests) – 2026-01-07
- 전체 페이지 통합 테스트: Sidebar, Calendar, FlowBoard 렌더링 검증 (RTL 기반)
- 모든 테스트 통과: 8개 테스트 파일, 26개 테스트 ✓
- 커밋 ID: f1629f0 (초기), a1be375 (log 업데이트)

## 코드 리뷰 개선: Integration Test 명확화 (2026-01-07)
- Medium: page.e2e.test.tsx → page.integration.test.tsx 이름 변경 (실제로는 RTL 통합 테스트)
- Low: 숫자 기반 검증에 주석 추가 - 통합 테스트에서는 전체 렌더링 검증이 목적임을 명확화
- 문서 용어 통일: "E2E" → "통합 테스트 (RTL 기반)"으로 수정
- 참고: MVP 단계에서는 Playwright/Cypress 같은 진짜 E2E 도구 사용하지 않음
- 커밋 ID: a55afd8

## 코드 리뷰 후속: 불필요한 import 제거 (2026-01-07)
- Low: within import 제거 - 실제로 사용하지 않는 import 정리
- Low: log.md 내용 수정 - within() 사용 관련 오기 수정

## Phase 5 작업 기록: 수동 동기화 구현 (2026-01-08)
- FlowBoard에 동기화 버튼 추가 (refetch 호출) – 2026-01-08
- NotionCalendar에 동기화 버튼 추가 (refetch 호출) – 2026-01-08
- 동기화 로딩/성공 상태 UI 반영 (애니메이션 + 배경색 변경) – 2026-01-08
- RefreshCw 아이콘 회전 애니메이션 추가 – 2026-01-08
- 동기화 성공 시 2초간 초록색 배경 표시 – 2026-01-08
- NotionCalendar.test.tsx: 텍스트 수정 통과 (Connected to Notion → notion connect success) – 2026-01-08
- FlowBoard.test.tsx: 3개 테스트 통과 – 2026-01-08
