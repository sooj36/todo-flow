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
- 테스트 정합성: 리팩토링 작업에서는 임시 테스트 삭제 금지. 필요한 경우 별도 파일로 격리 후 유지.
- 리팩토링 검증: 분리 단계마다 기존 테스트 + 핵심 인터랙션 1건 이상 유지 (노드 토글, 동기화 버튼 등).

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

### 7.0 리팩토링 순서 체크리스트
- [ ] 현재 브랜치/변경사항 확인 (git status)
- [ ] 테스트 환경 최소 수정 (리팩토링 시작 전 필수)
  - [ ] vitest.setup.ts에 ResizeObserver mock 추가
  - [ ] vitest.setup.ts에 localStorage mock 수정 (getItem is not a function)
  - [ ] pnpm test:run 실행해서 환경 문제만 해결되었는지 확인
  - Note: 테스트 로직 실패(filter, 통합 테스트)는 별도 이슈로 추적, 리팩토링 블로킹 아님
- [ ] FlowBoard.tsx 현재 라인 기준 주석 또는 메모 확보
- [ ] 분리 대상 의존성 정리 (React Flow, Notion hooks, UI 상태)
- [ ] 기존 테스트/핵심 인터랙션 테스트 확인 (노드 토글, 동기화 버튼)
- [ ] 각 단계 완료 후: 타입 체크 + 테스트 실행 + 커밋
- [ ] 단계별 수행: 유틸 → 훅 → 컴포넌트 → 최종 검증 순서 준수 (의존성 역순)
- [ ] 단계별 전환 시 FlowBoard.tsx 역할 재정의 (렌더/상태/효과/핸들러 구분)
- [ ] 분리 후 불필요한 import/중복 타입 제거
- [ ] 상태/핸들러 이름 일관성 재점검 (isSyncing, syncSuccess 등)

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
- [ ] utils/nodePositions.ts 생성
  - loadNodePositions, saveNodePositions 함수 이동 (47-68줄)
  - NODE_POSITIONS_KEY 상수 포함
  - 검증: 노드 드래그 후 새로고침 시 위치 유지

- [ ] utils/flowNodes.ts 생성
  - createFlowNodes 함수 (184-273줄 로직)
  - Props: { loading, error, instances, templates, stepOverrides, stepUpdating, isConnected, handleToggleFlowStep }
  - savedPositions 처리: 함수 내부에서 loadNodePositions() 직접 호출 (부작용 최소화)
  - 반환 타입: { nodes: Node[], edges: Edge[] }
  - 순수 함수 유지: React Flow instance 접근 금지
  - edges 생성 포함 여부 명시
  - 검증: 노드/엣지 생성 로직 정상

### 7.2 커스텀 훅 분리
- [ ] hooks/useFlowSync.ts 생성
  - handleSync 로직 (88-119줄)
  - 상태: isSyncing, syncSuccess, syncError, syncErrorMessage
  - syncTimeoutRef 관리 포함
  - success/error 상태 reset 타이밍 명시 (예: 2–3s 후 초기화)
  - 검증: 동기화 버튼 클릭 시 Notion refetch 및 UI 상태 업데이트

- [ ] hooks/useFlowSteps.ts 생성
  - handleToggleFlowStep 로직 (121-167줄)
  - 상태: stepOverrides, stepUpdating, stepUpdatingRef
  - templates 변경 시 초기화 로직 포함 (177-181줄 useEffect)
  - 경쟁 상태 방지 규칙 명시 (중복 토글 차단, 실패 시 rollback)
  - 검증: 체크박스 토글 시 Notion 업데이트 및 낙관적 UI 업데이트

### 7.3 컴포넌트 분리
- [ ] components/flow/CustomFlowNode.tsx 분리 (477-602줄)
  - CustomNodeData interface 포함
  - 기존 FlowBoard에서 import로 전환
  - 의존성 명시: React Flow NodeProps만 입력으로 받고, 외부 훅/컨텍스트 직접 접근 금지 (필요 시 props로 주입)
  - 검증: FlowBoard 렌더링 및 노드 인터랙션 정상 작동

- [ ] components/flow/FlowBoardHeader.tsx 분리 (325-407줄)
  - Props: { loading, error, isConnected, isSyncing, syncSuccess, syncError, syncErrorMessage, handleSync }
  - FlowBoardHeader는 UI 전용 컴포넌트로 유지; 네트워크/비즈니스 로직은 훅에서 처리
  - 검증: 헤더 UI 및 sync 버튼 동작 정상

### 7.4 최종 검증
- [ ] FlowBoard.tsx 최종 라인 수 200줄 이하 확인
- [ ] 기존 모든 기능 정상 작동 (수동 테스트)
- [ ] pnpm lint, pnpm test 통과
- [ ] 리팩토링 전후 비교 문서 작성 (docs/log.md)

## Phase 7+ Tasks (Test Debt Resolution)
- 목표: 기존 테스트 실패 해결 (리팩토링과 독립적)
- 우선순위: Medium (리팩토링 블로킹 아님, 병행 또는 이후 처리 가능)
- 영향도: 통합 테스트 안정성 향상, CI/CD 준비

### 7+.1 테스트 환경 Mock 추가 (High Priority)
- [ ] vitest.setup.ts에 ResizeObserver mock 추가
  - 요구사항: React Flow가 사용하는 ResizeObserver API를 jsdom 환경에서 mock
  - 구현 예시:
    ```typescript
    // globalThis 사용 권장: Node/브라우저 환경 모두 일관성 보장 (ES2020)
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    ```
  - 참고: vitest.setup.ts 현재 8줄, 환경변수 설정만 존재
  - 영향: 통합 테스트 3건 (page.integration.test.tsx) ResizeObserver 에러 해결

- [ ] vitest.setup.ts에 localStorage mock 수정
  - 요구사항: getItem/setItem/removeItem/clear 함수가 실제 동작하도록 수정
  - 현재 문제: window.localStorage.getItem is not a function
  - 구현 예시:
    ```typescript
    // In-memory storage as backing store
    const storage: Record<string, string> = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
      clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); })
    };
    // globalThis 사용으로 window.localStorage와 일관성 보장
    globalThis.localStorage = localStorageMock as any;
    ```
  - 또는 jsdom 기본 localStorage 활성화 방법 검토
  - 영향: app/page.tsx, components/flow/FlowBoard.tsx의 localStorage 호출 정상 동작

- [ ] 검증: pnpm test:run 실행, 환경 에러만 해결되었는지 확인
  - 성공 기준: ResizeObserver/localStorage 에러 사라짐
  - 테스트 로직 실패는 여전히 존재 가능 (7+.2, 7+.3에서 처리)

### 7+.2 API 테스트 로직 수정 (Medium Priority)
- [ ] app/api/notion/instances/route.test.ts 수정
  - 실패 케이스: should filter instances by date
  - 원인: 날짜 필터링 로직 또는 mock 데이터 불일치
  - 예상 작업: 테스트 데이터 또는 필터 assertion 수정
- [ ] app/api/notion/flow-steps/route.test.ts 수정
  - 실패 케이스: should filter steps by templateId
  - 원인: templateId 필터링 로직 또는 mock 데이터 불일치
  - 예상 작업: 테스트 데이터 또는 필터 assertion 수정
- [ ] app/api/notion/flow-steps/[stepId]/route.test.ts 수정
  - 실패 케이스: should update flow step done
  - 원인: PATCH 요청 처리 또는 mock 응답 불일치
  - 예상 작업: API 응답 mock 또는 assertion 수정

### 7+.3 통합 테스트 수정 (Low Priority)
- [ ] app/__tests__/page.integration.test.tsx 수정
  - 실패 케이스: 3건 (main page, calendar cells, FlowBoard elements)
  - 원인: ResizeObserver + localStorage 환경 문제
  - Note: 7+.1 완료 후 재실행 필요. 여전히 실패 시 테스트 로직 검토
- [ ] 최종 검증: pnpm test:run 전체 통과 확인

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
