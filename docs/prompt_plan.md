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

## Phase 8 Tasks (Code Refactoring - lib/notion.ts)
- 목표: lib/notion.ts 329줄 분리 → 유지보수성/재사용성 향상, 책임 분리
- 원칙: 각 단계마다 기존 API 테스트 통과 확인 → 커밋
- 브랜치: refactor/notion-lib-decomposition (refactor/flowboard-decomposition 완료 후 생성)
- 영향도: API 라우트 3개 (`templates`, `flow-steps`, `instances`) 의존성 있음

### 8.0 리팩토링 순서 체크리스트
- [x] 현재 브랜치/변경사항 확인 (git status)
- [x] 브랜치 생성 가능 여부 확인 (git checkout -b 시도 or .git/refs/heads 쓰기 권한 확인)
- [x] lib/notion.ts 현재 구조 분석 및 의존성 파악
  - [x] 클라이언트 관리 (line 기준은 참고용, 함수명 기준으로 확인)
  - [x] Task Templates (line 기준은 참고용, 함수명 기준으로 확인)
  - [x] Flow Steps (line 기준은 참고용, 함수명 기준으로 확인)
  - [x] Task Instances (line 기준은 참고용, 함수명 기준으로 확인)
- [x] API 라우트 의존성 확인
  - [x] app/api/notion/templates/route.ts
  - [x] app/api/notion/flow-steps/route.ts
  - [x] app/api/notion/instances/route.ts
- [x] 기존 API 테스트 실행 확인 (pnpm test:run app/api/notion) - 19 tests passed
- [x] 각 단계 완료 후: 타입 체크 + API 테스트(pnpm test:run app/api/notion) + 커밋
- [x] 단계별 수행: parsers → client → 각 도메인 모듈 순서 (의존성 역순) - 완료: 4f06ab2, b53df52, 2d0a97d
- [x] import 경로 정책 결정 (기존 `lib/notion` 유지 vs `lib/notion/*`로 일괄 변경) - lib/notion/index.ts로 re-export
- [x] 분리 후 기존 lib/notion.ts 삭제 또는 re-export 파일로 전환 - 삭제 완료
- [x] API 라우트 import 경로 수정 확인 (선택한 정책에 맞게 일괄 적용) - @/lib/notion 경로 유지됨

### 8.0.a 실행 순서 템플릿 (log.md 기록용)
```
- [ ] 단계: 8.x (예: 8.1 parsers 유틸 분리)
- [ ] 변경 요약:
- [ ] 검증: pnpm lint / pnpm test (API 라우트 테스트 결과)
- [ ] 커밋: <commit hash> (message)
```

### 8.0.b 커밋 메시지 규칙 예시
- 유틸: refactor: extract notion property parsers
- 클라이언트: refactor: extract notion client module
- 도메인: refactor: extract notion templates module
- 정리: refactor: consolidate notion lib exports

### 8.1 공통 파싱 유틸 분리
- [x] lib/notion/parsers.ts 생성
  - extractTitle: Title 속성 추출 (lines 52-54, 135-137, 219-222 패턴)
  - extractSelect: Select 속성 추출 (lines 64-66, 76-78, 238-240 패턴)
  - extractCheckbox: Checkbox 속성 추출 (lines 70-72, 82-84, 152-155 패턴)
  - extractRelation: Relation 속성 추출 (lines 147-149, 226-228, 244-246 패턴)
  - extractRelationMulti: Relation 다중 추출 (lines 250-252 패턴)
  - extractNumber: Number 속성 추출 (lines 141-143 패턴)
  - extractDate: Date 속성 추출 (lines 232-234, 259-261 패턴)
  - extractRichText: Rich Text 추출 (lines 58-60 패턴)
  - 타입: 제네릭 활용 (TaskColor, Frequency, TaskStatus 등)
  - [x] 검증: 각 파싱 함수 단위 테스트 작성 (parsers.test.ts) - 23 tests passed
  - [x] 커밋: test: add unit tests for notion parsers

### 8.2 클라이언트 모듈 분리
- [x] lib/notion/client.ts 생성
  - createNotionClient 함수 (lines 6-11) ✅
  - getNotionClient 함수 (lines 17-26) ✅
  - Client import 포함 ✅
  - [x] 검증: API 라우트에서 클라이언트 사용 정상 확인 - 19 tests passed
  - [x] 커밋: Phase 8.0에서 완료 (4f06ab2)

### 8.3 Task Templates 모듈 분리
- [x] lib/notion/templates.ts 생성
  - getTaskTemplates 함수 (lines 32-99)
  - parsers.ts의 파싱 함수 활용으로 코드 간소화
  - Client import 및 타입 import
  - 검증: app/api/notion/templates/route.ts 정상 작동
  - 검증: pnpm test templates/route.test.ts 통과
  - [x] 커밋: refactor: extract notion templates module

### 8.4 Flow Steps 모듈 분리
- [x] lib/notion/flowSteps.ts 생성
  - getFlowSteps 함수 (lines 105-167)
  - updateFlowStepDone 함수 (lines 173-186)
  - parsers.ts의 파싱 함수 활용으로 코드 간소화
  - Client import 및 타입 import
  - 검증: app/api/notion/flow-steps/route.ts 정상 작동
  - 검증: pnpm test flow-steps/route.test.ts 통과
  - [x] 커밋: refactor: extract notion flow steps module

### 8.5 Task Instances 모듈 분리
- [x] lib/notion/instances.ts 생성
  - getTaskInstances 함수 (lines 192-277)
  - createTaskInstance 함수 (lines 283-329)
  - parsers.ts의 파싱 함수 활용으로 코드 간소화
  - Client import 및 타입 import
  - 검증: app/api/notion/instances/route.ts 정상 작동
  - 검증: pnpm test instances/route.test.ts 통과
  - [x] 커밋: refactor: extract notion instances module

### 8.6 lib/notion.ts 정리 및 re-export
- [x] lib/notion/index.ts 생성 (또는 기존 lib/notion.ts를 index.ts로 변경)
  - client, templates, flowSteps, instances 모듈에서 re-export
  - 기존 import 경로 유지를 위한 호환성 레이어
  - 예: `export * from './client'`, `export * from './templates'` 등
  - 검증: 모든 API 라우트에서 import 정상 작동
  - [x] 커밋: refactor: consolidate notion lib exports

### 8.7 최종 검증
- [x] lib/notion/ 폴더 구조 확인
  - client.ts, templates.ts, flowSteps.ts, instances.ts, parsers.ts, index.ts
- [x] 모든 API 라우트 정상 작동 (수동 테스트)
- [x] pnpm lint, pnpm test 통과
- [x] 파싱 함수 재사용으로 코드 라인 수 감소 확인
- [x] 리팩토링 전후 비교 문서 작성 (docs/log.md)
- [x] 타입 오류/import 경로 오류 없음 확인
  - [x] 커밋: docs: update Phase 8 refactoring log

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
