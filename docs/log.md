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

## 코드 리뷰 수정: 동기화 에러 처리 및 메모리 누수 방지 (2026-01-08)
- High: refetch 실패 감지 추가 - error 상태 확인하여 syncSuccess/syncError 분기 – 2026-01-08
- High: 동기화 실패 시 빨간 배경 2초간 표시 (syncError 상태 추가) – 2026-01-08
- Medium: setTimeout cleanup 구현 - useRef + useEffect로 언마운트 시 타이머 정리 – 2026-01-08
- Medium: 동기화 재시도 시 이전 타이머 취소 (중복 타이머 방지) – 2026-01-08
- NotionCalendar.test.tsx: 1개 테스트 통과 – 2026-01-08
- FlowBoard.test.tsx: 3개 테스트 통과 – 2026-01-08

## 코드 리뷰 후속: 레이스 컨디션 해결 (2026-01-08)
- High: refetch 함수가 Promise<{ success: boolean }> 반환하도록 훅 API 수정 – 2026-01-08
- High: 레이스 컨디션 제거 - refetch 반환값으로 성공/실패 판정 – 2026-01-08
- Medium: handleSync deps에서 error 제거 - 불필요한 함수 재생성 방지 – 2026-01-08
- useTaskInstances: refetch가 { success: boolean } 반환 – 2026-01-08
- useTaskTemplates: refetch가 { success: boolean } 반환 – 2026-01-08
- FlowBoard/NotionCalendar: refetch 결과로 즉시 성공/실패 판정 – 2026-01-08
- hooks/useTaskInstances.test.ts: 3개 테스트 통과 – 2026-01-08
- hooks/useTaskTemplates.test.ts: 2개 테스트 통과 – 2026-01-08
- NotionCalendar.test.tsx: 1개 테스트 통과 – 2026-01-08
- FlowBoard.test.tsx: 3개 테스트 통과 – 2026-01-08

## 코드 리뷰 후속: 에러 메시지 반환 추가 (2026-01-08)
- Medium: refetch가 { success: boolean, error?: string } 반환하도록 수정 – 2026-01-08
- Medium: 동기화 실패 시 구체적인 에러 메시지 버튼 title로 표시 – 2026-01-08
- syncErrorMessage 상태 추가하여 에러 메시지 관리 – 2026-01-08
- 버튼 호버 시 "Sync failed: {error message}" 툴팁 표시 – 2026-01-08
- useTaskInstances: 실패 시 error 메시지 반환 – 2026-01-08
- useTaskTemplates: 실패 시 error 메시지 반환 – 2026-01-08
- FlowBoard/NotionCalendar: 에러 메시지를 title 속성으로 표시 – 2026-01-08
- hooks/useTaskInstances.test.ts: 3개 테스트 통과 – 2026-01-08
- hooks/useTaskTemplates.test.ts: 2개 테스트 통과 – 2026-01-08
- NotionCalendar.test.tsx: 1개 테스트 통과 – 2026-01-08
- FlowBoard.test.tsx: 3개 테스트 통과 – 2026-01-08

## 접근성 개선: 에러 메시지 표시 강화 (2026-01-08)
- Low: 에러 메시지를 화면에 가시적으로 표시 - 버튼 옆에 텍스트로 노출 – 2026-01-08
- Low: aria-live 영역 추가 - 스크린 리더 접근성 향상 (role="status", aria-live="polite") – 2026-01-08
- Low: 타임아웃 연장 - 2초 → 5초로 변경하여 충분한 읽기 시간 확보 – 2026-01-08
- sr-only CSS 클래스 추가 - 시각적으로 숨기되 스크린 리더에서 접근 가능 – 2026-01-08
- 버튼에 aria-label 추가 - 에러 메시지를 스크린 리더에 전달 – 2026-01-08
- FlowBoard/NotionCalendar 모두 적용 – 2026-01-08
- FlowBoard.test.tsx: 3개 테스트 통과 – 2026-01-08

## 성능 최적화: stepUpdatingRef 직접 mutation (2026-01-08)
- Low: stepUpdatingRef 업데이트 시 객체 스프레드 제거 → 직접 mutation으로 변경 – 2026-01-08
- 불필요한 객체 복사 제거로 메모리 효율성 향상 – 2026-01-08
- 빠른 토글 시 race condition 방지 (동일 객체 참조 유지) – 2026-01-08
- 변경: `stepUpdatingRef.current = { ...stepUpdatingRef.current, [stepId]: true }` → `stepUpdatingRef.current[stepId] = true` – 2026-01-08
- components/flow/FlowBoard.tsx line 135, 164 수정 – 2026-01-08
- FlowBoard.test.tsx: 3개 테스트 통과 – 2026-01-08

## Phase 7 작업 기록: FlowBoard 리팩토링 (2026-01-09)
- 목표: FlowBoard.tsx 602줄 → 200줄 이하로 분리
- 원칙: 각 단계마다 기존 테스트 통과 확인 → 커밋

### 7.0 사전 준비
- vitest.setup.ts에 ResizeObserver mock 추가 – 2026-01-09
- vitest.setup.ts에 localStorage mock 추가 (in-memory storage 방식) – 2026-01-09
- 커밋 ID: c008a68 – 2026-01-09

### 7.1 유틸리티 분리
- utils/nodePositions.ts 생성 (loadNodePositions, saveNodePositions) – 2026-01-09
- 커밋 ID: 4522df7 – 2026-01-09
- utils/flowNodes.ts 생성 (createFlowNodes 함수, 노드/엣지 생성 로직) – 2026-01-09
- FlowBoard.tsx: 602줄 → 507줄 (95줄 감소) – 2026-01-09
- 커밋 ID: 582ea26 – 2026-01-09

### 7.2 커스텀 훅 분리
- hooks/useFlowSync.ts 생성 (handleSync, isSyncing, syncSuccess, syncError 상태 관리) – 2026-01-09
- syncTimeoutRef 관리 포함, 5초 후 상태 자동 초기화 – 2026-01-09
- 커밋 ID: 4730481 – 2026-01-09
- hooks/useFlowSteps.ts 생성 (handleToggleFlowStep, stepOverrides, stepUpdating 상태 관리) – 2026-01-09
- 경쟁 상태 방지 (stepUpdatingRef 사용), 실패 시 rollback 구현 – 2026-01-09
- templates 변경 시 자동 초기화 로직 포함 – 2026-01-09
- FlowBoard.tsx: 507줄 → 428줄 (79줄 감소) – 2026-01-09
- 커밋 ID: 04eb8de – 2026-01-09

### 7.3 컴포넌트 분리
- components/flow/CustomFlowNode.tsx 분리 (CustomNodeData interface 포함) – 2026-01-09
- React Flow NodeProps만 입력으로 받도록 설계 (외부 훅/컨텍스트 직접 접근 금지) – 2026-01-09
- FlowBoard.tsx: 428줄 → 274줄 (154줄 감소) – 2026-01-09
- 커밋 ID: b213d01 – 2026-01-09
- components/flow/FlowBoardHeader.tsx 분리 (UI 전용 컴포넌트) – 2026-01-09
- Props: loading, error, isConnected, isSyncing, syncSuccess, syncError, syncErrorMessage, handleSync – 2026-01-09
- FlowBoard.tsx: 274줄 → 198줄 (76줄 감소) – 2026-01-09
- 커밋 ID: 6196f9c – 2026-01-09

### 7.4 최종 검증
- FlowBoard.tsx 최종 라인 수: 198줄 (목표 200줄 이하 달성 ✓) – 2026-01-09
- 전체 감소량: 602줄 → 198줄 (404줄, 67% 감소) – 2026-01-09
- pnpm lint 통과 ✓ – 2026-01-09
- pnpm build 통과 ✓ – 2026-01-09

### 리팩토링 전후 비교
**Before (602줄)**
- FlowBoard.tsx에 모든 로직 집중
- 유틸리티, 훅, 컴포넌트 모두 단일 파일에 포함

**After (198줄 + 분리된 파일들)**
- utils/nodePositions.ts (23줄): localStorage 관련 유틸리티
- utils/flowNodes.ts (119줄): 노드/엣지 생성 로직
- hooks/useFlowSync.ts (70줄): 동기화 상태 관리
- hooks/useFlowSteps.ts (82줄): 플로우 스텝 상태 관리
- components/flow/CustomFlowNode.tsx (156줄): 커스텀 노드 UI
- components/flow/FlowBoardHeader.tsx (115줄): 헤더 UI
- components/flow/FlowBoard.tsx (198줄): 메인 컴포넌트 (조율 역할)

**개선 효과**
- 유지보수성 향상: 각 파일이 단일 책임 원칙(SRP)을 따름
- 재사용성 향상: 유틸리티, 훅, 컴포넌트를 다른 곳에서도 사용 가능
- 테스트 용이성: 각 모듈을 독립적으로 테스트 가능
- 코드 가독성: FlowBoard.tsx가 orchestration 역할만 수행

## 코드 리뷰 후속: 타입 오류 수정 (2026-01-09)
- High: utils/flowNodes.ts에 ReactNode import 추가 – 2026-01-09
  - React.ReactNode → ReactNode로 변경
  - import type { ReactNode } from "react" 추가
- High: hooks/useFlowSteps.ts에 MutableRefObject import 추가 – 2026-01-09
  - React.MutableRefObject → MutableRefObject로 변경
  - import type { MutableRefObject } from "react" 추가
- High: components/flow/FlowBoardHeader.tsx의 handleSync 타입 수정 – 2026-01-09
  - () => void → () => Promise<void>로 변경 (async 함수와 타입 일치)
- pnpm lint 통과 ✓ – 2026-01-09
- pnpm build 통과 ✓ – 2026-01-09
- 커밋 ID: 61a34d8 – 2026-01-09

## Phase 7+ 작업 기록: Test Debt Resolution (2026-01-09)
- 목표: API 테스트 실패 해결
- 우선순위: Medium (리팩토링 블로킹 아님)

### 7+.2 API 테스트 로직 수정
- app/api/notion/flow-steps/[stepId]/route.test.ts 수정 – 2026-01-09
  - Next.js 15에서 params가 Promise로 변경됨
  - route에서 params를 await 처리
  - 테스트에서 Promise.resolve() 사용
  - createNotionClient mock 추가
- app/api/notion/flow-steps/route.test.ts 수정 – 2026-01-09
  - createNotionClient mock 추가 (모든 테스트)
- app/api/notion/instances/route.test.ts 수정 – 2026-01-09
  - createNotionClient 및 getTaskTemplates mock 추가 (모든 테스트)
- 결과: 16개 API 테스트 모두 통과 ✅ – 2026-01-09
- 커밋 ID: 17bd16a – 2026-01-09
