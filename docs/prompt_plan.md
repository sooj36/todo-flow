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

## Phase 12 Tasks (Interactive Calendar Day Clicks)
- 목표: Calendar day 클릭 시 selectedDate 변경 및 FlowBoard 동기화
- 파일: components/calendar/NotionCalendar.tsx, app/page.tsx
- 원칙: 클릭 시 즉시 반응 (Optimistic UI 느낌), 명확한 상태 전파 (Calendar -> Parent -> Flow)
- UI/UX 결정: 클릭 시 포커스 강제 이동은 생략하되, 선택 스타일(isSelected)로 시각적 피드백 제공

## Phase 13 Tasks (AI Agent MVP: Keyword Clustering)
- 목표: 검색창 입력 → Notion "키워드 추출 완료" 페이지 수집 → LLM 클러스터링 결과 UI 렌더링
- 원칙: LLM은 Notion 직접 탐색 금지, 구조화 JSON + zod 검증, 진행 단계 표시 필수
- TDD: 각 단계 test 작성 → 구현 → 통과 → 커밋 순서 엄수

### 13.1 UI Entry Point (검색창 + 결과 패널)

#### 13.1.1 SearchBar 컴포넌트 (기본 레이아웃)
- 파일: `components/agent/SearchBar.tsx`
- [ ] Test: SearchBar 렌더링, placeholder 표시 확인
- [ ] Impl: input + Enter 핸들러 추가, onSearch prop 전달
- [ ] Test: Enter 입력 시 onSearch 콜백 호출 확인
- [ ] 커밋: `feat(agent): add SearchBar component`

#### 13.1.2 상태 관리 (useAgentQuery 훅)
- 파일: `lib/hooks/useAgentQuery.ts`
- queryText 전달 방식: 사용자 입력 → `{ queryText }` body로 POST → API에서 Notion 필터(title/keywords 부분 일치)에 전달
- 반환값: `{ phase, data, error, executeQuery: (text: string) => Promise<void> }`
- [ ] Test: 초기 상태 phase="idle", executeQuery 호출 시 phase="fetch"로 변경
- [ ] Impl: useState로 phase, data, error 관리
- [ ] Impl: executeQuery 내부에서 phase 단계별 업데이트 (fetch → normalize → cluster → done)
- [ ] Impl: POST /api/agent/keywords 호출, body: `{ queryText }`
- [ ] Test: 성공 시 phase="done" + 데이터 저장, 실패 시 phase="error"
- [ ] 커밋: `feat(agent): add useAgentQuery hook with phase tracking`

#### 13.1.3 진행 단계 표시 (ProgressIndicator)
- 파일: `components/agent/ProgressIndicator.tsx`
- 상태값 타입: `phase: "idle" | "fetch" | "normalize" | "cluster" | "done" | "error"`
- [ ] Test: phase="fetch"일 때 "Notion에서 완료 페이지 조회 중..." 렌더링
- [ ] Impl: phase prop 받아서 단계별 메시지 표시
- [ ] Test: phase="normalize" → "키워드 정규화 중...", phase="cluster" → "클러스터링 중..." 렌더링 확인
- [ ] Test: phase="done"/error 상태 메시지 렌더링 확인
- [ ] 커밋: `feat(agent): add ProgressIndicator with phase-based messaging`

#### 13.1.4 결과 패널 (ClusterResultPanel)
- 파일: `components/agent/ClusterResultPanel.tsx`
- [ ] Test: 결과 데이터(meta, clusters, topKeywords) 렌더링
- [ ] Impl: 접기/펼치기 토글 상태 관리
- [ ] Test: 클러스터 접기/펼치기 인터랙션 확인
- [ ] 커밋: `feat(agent): add ClusterResultPanel with collapsible clusters`

#### 13.1.5 통합 (app/page.tsx)
- 파일: `app/page.tsx`
- [ ] Impl: SearchBar, ProgressIndicator, ClusterResultPanel 배치
- [ ] Test: 검색 → 로딩 → 결과 표시 플로우 통합 테스트
- [ ] 커밋: `feat(agent): integrate agent UI into main page`

### 13.2 Notion Retrieval (키워드 추출 완료 필터)

#### 13.2.1 Notion Query 함수
- 파일: `lib/notion/keywords.ts`
- [ ] Test: getCompletedKeywordPages 호출 시 필터 조건 확인
- [ ] Impl: Notion API query, 필터: `키워드 추출 == true`
- [ ] Impl: 정렬: 최근 업데이트 순, limit: 20
- [ ] Test: queryText 있을 때 title/keywords 부분 일치 필터 확인
- [ ] 커밋: `feat(notion): add getCompletedKeywordPages query`

#### 13.2.2 데이터 정규화
- 파일: `lib/notion/keywords.ts` (함수 내부)
- [ ] Test: 응답 데이터를 { pageId, title, keywords[] } 형태로 변환
- [ ] Impl: trim, 중복 제거, 빈 값 제거 로직 추가
- [ ] Test: keywords 배열 정제 결과 확인
- [ ] 커밋: `feat(notion): normalize keyword page data`

#### 13.2.3 에러 처리 (Failure Modes)
- 파일: `lib/notion/keywords.ts`
- [ ] Test: 완료 페이지 0개 → 특정 에러 메시지 throw
- [ ] Impl: 키워드 속성 없음 → 가이드 메시지 throw
- [ ] Test: Cold start 시나리오 → "최소 3~5개 키워드 입력 필요" 안내
- [ ] 커밋: `feat(notion): add failure handling for empty results`

### 13.3 LLM Orchestration (Gemini + 구조화 출력)

#### 13.3.1 API 라우트 (기본 구조)
- 파일: `app/api/agent/keywords/route.ts`
- [ ] Test: POST 요청 시 queryText 파싱 확인
- [ ] Impl: export async function POST(req: Request)
- [ ] Impl: 입력: { queryText?: string }, 기본값 빈 문자열
- [ ] 커밋: `feat(api): add POST /api/agent/keywords route`

#### 13.3.2 Gemini 클러스터링 함수
- 파일: `lib/agent/clustering.ts`
- [ ] Test: 페이지 배열 입력 → 클러스터 JSON 출력 확인
- [ ] Impl: Gemini API 호출, 프롬프트: 동의어 통일 + 5~8개 클러스터
- [ ] Impl: 구조화 출력 설정 (JSON mode)
- [ ] Test: 응답이 고정 스키마 형태인지 확인
- [ ] 커밋: `feat(agent): add Gemini clustering function`

#### 13.3.3 스키마 검증 (zod)
- 파일: `lib/agent/schema.ts`
- [ ] Test: zod 스키마로 클러스터 응답 파싱 성공/실패 케이스
- [ ] Impl: ClusterResultSchema 정의 (meta, clusters, topKeywords)
- [ ] Impl: 파싱 실패 시 ZodError throw
- [ ] 커밋: `feat(agent): add zod schema for cluster result`

#### 13.3.4 Fallback 처리
- 파일: `app/api/agent/keywords/route.ts`
- [ ] Test: Gemini 실패 시 1회 재시도 확인
- [ ] Impl: try-catch로 재시도 로직 추가
- [ ] Test: 2회 실패 시 topKeywords만 반환 (빈도 집계)
- [ ] Impl: 빈도 집계 fallback 함수 추가
- [ ] 커밋: `feat(api): add fallback for LLM failure`

#### 13.3.5 성능/비용 메모
- 파일: `docs/plan_b.md` (추가 섹션)
- [ ] 문서: 20페이지 기준 2k~4k tokens, 3~5초 목표 명시
- [ ] 문서: Gemini Free Tier 한도 (RPM/TPM) 기록
- [ ] 커밋: `docs: add performance and cost notes for agent`

### 13.4 UX & Evidence

#### 13.4.1 pageRefs 포함
- 파일: `lib/agent/clustering.ts` (프롬프트 수정)
- [ ] Test: 각 클러스터에 pageRefs 최소 1개 포함 확인
- [ ] Impl: 프롬프트에 "각 클러스터마다 pageId 포함" 명시
- [ ] 커밋: `feat(agent): include pageRefs in cluster output`

#### 13.4.2 근거 표시 UI
- 파일: `components/agent/ClusterResultPanel.tsx`
- [ ] Test: pageRefs 렌더링 시 페이지 타이틀 표시
- [ ] Impl: 각 클러스터 내 pageRefs 리스트 렌더링
- [ ] 커밋: `feat(agent): display pageRefs as evidence`

### 13.5 Verification & Integration

#### 13.5.1 Manual Testing
- [ ] Manual: 검색 입력 → 로딩 → 결과 렌더링 E2E 확인
- [ ] Manual: 완료 페이지 0개 시나리오 → 안내 메시지 표시 확인
- [ ] Manual: 키워드 없음 시나리오 → 가이드 문구 표시 확인

#### 13.5.2 Unit Tests
- [ ] Test: Notion query 필터 조건 (lib/notion/keywords.test.ts)
- [ ] Test: zod 스키마 검증 실패 → fallback (lib/agent/schema.test.ts)
- [ ] Test: 빈도 집계 fallback 동작 (lib/agent/clustering.test.ts)

#### 13.5.3 Integration Tests
- Mock 전략: MSW (Mock Service Worker) 사용, POST /api/agent/keywords 핸들러 등록
- [ ] Test: UI 통합 (검색 → 로딩 → 결과) (app/__tests__/agent.test.tsx)
  - MSW로 성공/실패 시나리오 mock 응답 설정
  - userEvent로 검색창 입력 → Enter → phase 변화 → 결과 렌더링 확인
- [ ] Test: API 라우트 E2E (app/api/agent/keywords/route.test.ts)
  - Notion/Gemini 호출은 vi.spyOn으로 mock, 실제 라우트 핸들러 호출

#### 13.5.4 Final Commit
- [ ] 커밋: `feat: complete AI agent keyword clustering MVP (Phase 13)`
- [ ] PR: Phase 13 완료, 체크리스트 링크



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
