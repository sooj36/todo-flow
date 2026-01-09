
# 완료된 단계(보관용)

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

## Phase 7 Tasks (Code Refactoring - FlowBoard) ✅ 완료
- 목표: FlowBoard.tsx 600+ 줄 분리 → 유지보수성/재사용성 향상
- 원칙: 각 단계마다 기존 테스트 통과 확인 → 커밋
- 브랜치: refactor/flowboard-decomposition (feature/layout-resize 완료 후 생성)
- **결과**: 600+줄 → 198줄 (67% 감소), 6개 파일로 분리

### 7.0 리팩토링 순서 체크리스트
- [x] 현재 브랜치/변경사항 확인 (git status)
- [x] 테스트 환경 최소 수정 (리팩토링 시작 전 필수)
  - [x] vitest.setup.ts에 ResizeObserver mock 추가
  - [x] vitest.setup.ts에 localStorage mock 수정 (getItem is not a function)
  - [x] pnpm test:run 실행해서 환경 문제만 해결되었는지 확인
  - Note: 테스트 로직 실패(filter, 통합 테스트)는 별도 이슈로 추적, 리팩토링 블로킹 아님
- [x] FlowBoard.tsx 현재 라인 기준 주석 또는 메모 확보
- [x] 분리 대상 의존성 정리 (React Flow, Notion hooks, UI 상태)
- [x] 기존 테스트/핵심 인터랙션 테스트 확인 (노드 토글, 동기화 버튼)
- [x] 각 단계 완료 후: 타입 체크 + 테스트 실행 + 커밋
- [x] 단계별 수행: 유틸 → 훅 → 컴포넌트 → 최종 검증 순서 준수 (의존성 역순)
- [x] 단계별 전환 시 FlowBoard.tsx 역할 재정의 (렌더/상태/효과/핸들러 구분)
- [x] 분리 후 불필요한 import/중복 타입 제거
- [x] 상태/핸들러 이름 일관성 재점검 (isSyncing, syncSuccess 등)

### 7.0.a 실행 순서 템플릿 (log.md 기록용)
```
- [ ] 단계: 7.x (예: 7.1 nodePositions 유틸 분리)
- [ ] 변경 요약:
- [ ] 검증: pnpm lint / pnpm test (결과, 시간)
- [ ] 커밋: <commit hash> (message)
```

### 7.0.b 커밋 메시지 규칙 예시
- 리팩토링: refactor: extract CustomFlowNode component
- 유틸: refactor: move node position utils
- 훅: refactor: add useFlowSteps hook
- 검증/정리: chore: verify flowboard refactor step

### 7.1 유틸리티 분리
- [x] utils/nodePositions.ts 생성
  - loadNodePositions, saveNodePositions 함수 이동 (47-68줄)
  - NODE_POSITIONS_KEY 상수 포함
  - 검증: 노드 드래그 후 새로고침 시 위치 유지
  - 커밋: 4522df7

- [x] utils/flowNodes.ts 생성
  - createFlowNodes 함수 (184-273줄 로직)
  - Props: { loading, error, instances, templates, stepOverrides, stepUpdating, isConnected, handleToggleFlowStep }
  - savedPositions 처리: 함수 내부에서 loadNodePositions() 직접 호출 (부작용 최소화)
  - 반환 타입: { nodes: Node[], edges: Edge[] }
  - 순수 함수 유지: React Flow instance 접근 금지
  - edges 생성 포함 여부 명시
  - 검증: 노드/엣지 생성 로직 정상
  - 커밋: 582ea26

### 7.2 커스텀 훅 분리
- [x] hooks/useFlowSync.ts 생성
  - handleSync 로직 (88-119줄)
  - 상태: isSyncing, syncSuccess, syncError, syncErrorMessage
  - syncTimeoutRef 관리 포함
  - success/error 상태 reset 타이밍 명시 (5s 후 초기화)
  - 검증: 동기화 버튼 클릭 시 Notion refetch 및 UI 상태 업데이트
  - 커밋: 4730481

- [x] hooks/useFlowSteps.ts 생성
  - handleToggleFlowStep 로직 (121-167줄)
  - 상태: stepOverrides, stepUpdating, stepUpdatingRef
  - templates 변경 시 초기화 로직 포함 (177-181줄 useEffect)
  - 경쟁 상태 방지 규칙 명시 (중복 토글 차단, 실패 시 rollback)
  - 검증: 체크박스 토글 시 Notion 업데이트 및 낙관적 UI 업데이트
  - 커밋: 04eb8de

### 7.3 컴포넌트 분리
- [x] components/flow/CustomFlowNode.tsx 분리 (477-602줄)
  - CustomNodeData interface 포함
  - 기존 FlowBoard에서 import로 전환
  - 의존성 명시: React Flow NodeProps만 입력으로 받고, 외부 훅/컨텍스트 직접 접근 금지 (필요 시 props로 주입)
  - 검증: FlowBoard 렌더링 및 노드 인터랙션 정상 작동
  - 커밋: b213d01

- [x] components/flow/FlowBoardHeader.tsx 분리 (325-407줄)
  - Props: { loading, error, isConnected, isSyncing, syncSuccess, syncError, syncErrorMessage, handleSync }
  - FlowBoardHeader는 UI 전용 컴포넌트로 유지; 네트워크/비즈니스 로직은 훅에서 처리
  - 검증: 헤더 UI 및 sync 버튼 동작 정상
  - 커밋: 6196f9c

### 7.4 최종 검증
- [x] FlowBoard.tsx 최종 라인 수 200줄 이하 확인 (198줄 달성)
- [x] 기존 모든 기능 정상 작동 (수동 테스트)
- [x] pnpm lint, pnpm test 통과
- [x] 리팩토링 전후 비교 문서 작성 (docs/log.md)
- [x] 타입 오류 수정 (React import, async 함수 타입)
- 커밋: a0f5751 (문서화), 61a34d8 (타입 수정), 800f16b (문서 업데이트)