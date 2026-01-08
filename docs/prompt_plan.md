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
- [x] Notion 연결 값 저장 방식 확정 (개인용: .env 환경변수 기반)
- [x] 클라이언트 저장/입력 제거 (보안 우선)
- [x] 연결 상태 UI 반영 (API 성공 시 notion connect success)

## Phase 5 Tasks (Manual Sync)
- [x] FlowBoard 동기화 버튼 추가 (refetch 호출)
- [x] 캘린더 동기화 버튼 추가 (refetch 호출)
- [x] 동기화 로딩/성공 상태 UI 반영
- Note: 수동 동기화는 Notion 재조회만 수행 (쓰기 없음)
- Note: 자동/폴링 없이 버튼 클릭으로만 갱신
- Note: 로딩/성공/에러 상태 표시 기준 정의

## Phase 6 Tasks (Flow ↔ Notion Sync)
- [x] 오른쪽 Flow 칸의 FlowStep 체크 시 Notion DB와 상호 연동

## Phase 7 Tasks (Code Refactoring - FlowBoard)
- 목표: FlowBoard.tsx 600+ 줄 분리 → 유지보수성/재사용성 향상
- 원칙: 각 단계마다 기존 테스트 통과 확인 → 커밋
- 브랜치: refactor/flowboard-decomposition (feature/layout-resize 완료 후 생성)

### 7.1 컴포넌트 분리
- [ ] components/flow/CustomFlowNode.tsx 분리 (477-602줄)
  - CustomNodeData interface 포함
  - 기존 FlowBoard에서 import로 전환
  - 검증: FlowBoard 렌더링 및 노드 인터랙션 정상 작동

- [ ] components/flow/FlowBoardHeader.tsx 분리 (325-407줄)
  - Props: { loading, error, isConnected, isSyncing, syncSuccess, syncError, syncErrorMessage, handleSync }
  - 검증: 헤더 UI 및 sync 버튼 동작 정상

### 7.2 유틸리티 분리
- [ ] utils/nodePositions.ts 생성
  - loadNodePositions, saveNodePositions 함수 이동
  - NODE_POSITIONS_KEY 상수 포함
  - 검증: 노드 드래그 후 새로고침 시 위치 유지

- [ ] utils/flowNodes.ts 생성
  - createFlowNodes 함수 (184-272줄 로직)
  - Props: { loading, error, instances, templates, stepOverrides, stepUpdating, isConnected, handleToggleFlowStep }
  - 검증: 노드/엣지 생성 로직 정상

### 7.3 커스텀 훅 분리
- [ ] hooks/useFlowSync.ts 생성
  - handleSync 로직 (88-119줄)
  - 상태: isSyncing, syncSuccess, syncError, syncErrorMessage
  - 검증: 동기화 버튼 클릭 시 Notion refetch 및 UI 상태 업데이트

- [ ] hooks/useFlowSteps.ts 생성
  - handleToggleFlowStep 로직 (121-167줄)
  - 상태: stepOverrides, stepUpdating, stepUpdatingRef
  - 검증: 체크박스 토글 시 Notion 업데이트 및 낙관적 UI 업데이트

### 7.4 최종 검증
- [ ] FlowBoard.tsx 최종 라인 수 200줄 이하 확인
- [ ] 기존 모든 기능 정상 작동 (수동 테스트)
- [ ] pnpm lint, pnpm test 통과
- [ ] 리팩토링 전후 비교 문서 작성 (docs/log.md)

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
- If error: Analyze, fix, update this file. (Codex로 commit 평가 후, 수정 사항 적용.)
- 코드 작성 전 브랜치명을 확인해서 (feature, test, design) 구분해서 할 것  
    ex)feature/layout-resize
- 브랜치 checkout이 필요한 경우, 현재 브랜치 commit -> push -> PR 생성/병합 완료해서 브랜치 코드간 연동되도록 할 것.
- PR 전에 git pull로 최신 상태 확인하고, 충돌 해결하세요.
- 커밋 메시지에 bold처리 (****), 이모지 기입하지 말것. (
    Conventional Commits 스타일 추천: feat: description)
- 단위 작업이 끝나면 반드시 커밋 작업까지 완료할 것. 완료 후 커밋 아이디 결과 알려줄 것.
- TDD 추가: Test code 필수적으로 작성하되, 완료 후 지우지 말고 유지할 것. (임시 테스트라면 별도 파일로 격리.)
