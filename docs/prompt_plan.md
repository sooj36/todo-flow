# prompt_plan.md - Implementation Roadmap Checklist

## Instructions for AI
- Read @spec.md, @PRD.md first.
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

## Future Extension: Agentic AI (Auto Triage) (ai agent)
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

## Phase 14: Calendar + Button → Create Template/Steps/Instance (Notion Sync)
### 14.1 스키마·밸리데이션 확정
- [x] Dialog validation: 템플릿명 필수, 반복 옵션 유효성(빈도/요일/limit 직렬화 스키마 확정), 아이콘·색상 화이트리스트(기존 TaskColor + 허용 아이콘만) 기본값 허용 but invalid 값 거르기 → 잘못된 입력 시 제출 차단 및 메시지 표시. Notion 스키마 확장: `frequency` select, `weekdays` multi-select(월~일 7개), `repeat_end` date(optional), `repeat_limit` number(optional)로 고정하고 직렬화/파싱 방식 확정.
  - lib/schema/templates.ts: TaskColorSchema, IconSchema(Lucide+이모지), FrequencySchema, WeekdaySchema, RepeatOptionsSchema, CreateTaskTemplateSchema 정의
- [x] 공통 밸리데이션 스키마(Zod 등) 정의: 프런트/백이 동일 스키마로 필수/허용값 검증(색상/아이콘/빈도/요일/limit) 공유해 중복 로직/불일치 방지. 입력 순서대로 FlowStep order 1..n 자동 할당 검증 포함.
  - FlowStepsInputSchema + assignStepOrders() 헬퍼 구현
  - types/index.ts에서 스키마 re-export로 프런트/백 단일 소스
- [x] 날짜/타임존 정책: 캘린더 클릭 로컬 날짜 → API payload `YYYY-MM-DD`(로컬 기준) → 서버에서 UTC 00:00으로 변환해 Notion date 저장(타임존 없음) 단일안 확정, 변환 테스트 포함.
  - lib/utils/dateTransform.ts: formatLocalDate, parseLocalDateString, localDateToUTC, notionDateToLocal, isValidDateString 등 구현
- [x] 밸리데이션 유닛 테스트: 색상/아이콘 화이트리스트, 반복 옵션 직렬화·파싱(요일/limit), 로컬 날짜→UTC 변환 Zod 스키마 테스트 작성/통과.
  - lib/schema/templates.test.ts: 42개 테스트 통과
  - lib/utils/dateTransform.test.ts: 25개 테스트 통과

### 14.2 API 설계/구현
- [x] API: 단일 POST로 Task Template → Flow Steps → Task Instance 순서로 생성 (기본값: 아이콘 📋, 색상 gray, Status todo, 날짜는 클릭한 셀). 중간 실패 시 생성된 페이지를 즉시 보상 트랜잭션으로 archive 처리(steps 실패 시 template만, instance 실패 시 template+steps) 또는 Active=false 업데이트하여 누수 방지하고, 응답에 cleanupIds/partialCleanup 플래그 포함해 재시도 UX 제공.
  - lib/notion/create-task-with-template.ts: createTaskWithTemplate() 함수 구현
  - app/api/notion/create-task/route.ts: POST 라우트 구현
- [x] API 요청/응답 스펙 명세: payload(날짜 `YYYY-MM-DD`, 템플릿 필드, FlowStep 배열, 반복 옵션 직렬화 구조)와 응답 확정 및 문서화. 응답 예시 `{ templateId, stepIds: [], instanceId, cleanupIds: [], partialCleanup: boolean }`로 고정(steps 정보는 미포함, 템플릿/스텝 반영은 refetch로 처리).
  - docs/log.md에 API 스펙 문서화 완료
- [x] API 스펙 테스트 초안: 단일 POST happy path, 기본값 적용, 중간 실패 시 cleanupIds/partialCleanup 반환 시나리오 유닛 테스트를 명세 기반으로 설계.
  - lib/notion/create-task-with-template.test.ts: 14개 테스트
  - app/api/notion/create-task/route.test.ts: 14개 테스트

### 14.3 프런트 다이얼로그/입력 검증
- [x] Calendar day `+` opens creation dialog (필드: 템플릿명, 색상 select, 아이콘 select, 반복 toggle/frequency/요일/end/limit, 스텝 리스트 입력)
  - components/calendar/CreateTaskDialog.tsx: 다이얼로그 컴포넌트 구현
  - NotionCalendar.tsx: + 버튼 클릭 시 다이얼로그 열림 연결
  - hooks/useCreateTask.ts: API 호출 훅 구현
- [x] Template/FlowStep 생성 필드 매핑: 색상(TaskColor whitelist)·아이콘 허용값 검증, Is Repeating/Default Frequency 기본값 적용, FlowStep done=false, Order auto-assign(입력 순 1..n), Parent Template relation 필수. 허용값 밖 입력은 제출 전 차단/보정.
  - CreateTaskTemplateSchema Zod 검증으로 제출 전 차단
  - 아이콘/색상 버튼 UI로 허용값만 선택 가능
  - 스텝 order 1..n 자동 할당 (입력 순서)
- [x] 에러/로딩 UX 정리: 제출 시 버튼 disable + 로딩 표시, 실패 메시지 노출, refetch 중 상태 표시. 부분 실패 시 "일부 생성물 정리됨/남음" 안내 문구 예시 포함, 다시 시도/중단 선택지 제공, 중복 제출 방지.
  - isSubmitting 상태로 버튼 disable + "생성 중..." 로딩 표시
  - partialFailure 상태로 부분 실패 메시지 + 다시 시도/취소 버튼
  - cleanupIds, partialCleanup 플래그로 정리 결과 표시
- [x] UI 통합 테스트 계획: 모달 필수 입력/허용값 밸리데이션, 중복 제출 방지(버튼 disable/재활성), 부분 실패 메시지 렌더링 플로우 사전 정의.
  - components/calendar/CreateTaskDialog.test.tsx: 12개 테스트 통과
  - 렌더링, 폼 검증, 제출 방지, 부분 실패 메시지, 다이얼로그 인터랙션 테스트

### 14.4 데이터 반영/동기화
- [x] Frontend: 제출 시 Notion 생성 → 성공하면 캘린더(`useTaskInstances` all) + FlowBoard(`useTaskInstances(date)` + `useTaskTemplates`) refetch를 모두 호출(steps 응답 미포함이므로 refetch 강제). 클릭한 날짜를 payload에 포함, 중복 제출 방지 플래그/로딩 상태 관리, refetch 중 상태 표시와 실패 메시지/재시도 제공.
  - NotionCalendar: onTaskCreated 콜백으로 부모에게 생성 완료 알림
  - page.tsx: flowBoardRefreshTrigger 상태로 FlowBoard refetch 조율
  - FlowBoard: refreshTrigger prop으로 부모 트리거 시 templates+instances refetch
- [x] FlowBoard 동기화: 단일 경로 확정 → steps는 응답에 포함하지 않고 `useTaskTemplates` refetch로 반영, 보상 실패 시에도 상태 일관성 유지.
  - useFlowSync 훅에서 refetch 로직 관리, 보상 실패와 무관하게 refetch 수행

### 14.5 테스트
- [x] 테스트: a) API 라우트 유닛(기본값 적용, 생성 순서, 중간 실패 보상/cleanupIds 포함), b) 반복 옵션 파싱/직렬화/검증(요일/limit), c) 다이얼로그 렌더/밸리데이션/제출/중복 제출 차단, d) 성공 후 캘린더+FlowBoard refetch 두 곳 모두 호출되는 통합 테스트(버튼 재활성 시점 포함).
  - a) lib/notion/create-task-with-template.test.ts (14개) + app/api/notion/create-task/route.test.ts (15개): 기본값 적용, 생성 순서, 중간 실패 보상/cleanupIds 테스트 포함
  - b) lib/schema/templates.test.ts (42개): 반복 옵션 파싱/직렬화/검증(요일/limit) 테스트 포함
  - c) components/calendar/CreateTaskDialog.test.tsx (17개): 다이얼로그 렌더/밸리데이션/제출/중복 제출 차단 테스트 포함
  - d) components/calendar/CreateTaskIntegration.test.tsx (9개) + components/flow/FlowBoardRefetch.test.tsx (9개): 성공 후 캘린더+FlowBoard refetch 통합 테스트 (버튼 재활성 시점 포함)

### 14.6 캘린더 인스턴스 날짜 정규화
- [x] Notion Date start 값(ISO/UTC)을 캘린더 키(YYYY-MM-DD)로 정규화해 인스턴스 누락 방지 (notionDateToLocal 사용)
- [x] lib/notion/parsers.ts: extractDate/nullable가 ISO 문자열을 YYYY-MM-DD로 변환
- [x] lib/notion/parsers.test.ts: ISO 입력 정규화 테스트 추가, 통과

### 14.7 체크리스트(FlowStep 토글) 클릭 시 진행률/퍼센트 UI가 즉시 반영되지 않는 문제

### 14.8 Dialog로 태스크 생성 시 선택한 아이콘·색상이 실제 생성 결과에 반영되지 않는 문제

### 14.9 캘린더/FlowBoard 사이 분할 바가 Dialog가 열려도 그대로 보여서 오버레이를 가리지 못하는 UI 문제

### 14.10 Dialog에서 FlowStep 입력 중 Enter 치면 마지막 음절이 다음 스텝으로 밀려 내려가는 입력 처리 버그

### 14.11 Dialog의 “반복 횟수(선택)” 필드 용도/동작을 명확히 정의·표기해야 하는 문제

## phase 15 

### phase 15.1 검색창 DB (KEYWORD DB -> PROJECT DB) 구현
- [ ] Notion Project DB 조회 함수 추가: `getProjectPages(queryText)` → 제목 contains 필터(한글 포함), page_size 20, 상태/레벨 필터 없음(default 전체). 실패 시 “프로젝트 DB에 일치하는 페이지가 없습니다” 반환.
- [ ] 검색 엔트리 흐름 교체: `/api/agent/keywords` → `/api/agent/project` (신규)로 연결, env는 `NOTION_PROJECT_DB_ID` 사용. queryText 미입력 시 400.
- [ ] 페이지 본문 최소 추출: 찾은 첫 페이지의 블록 children 중 토글 “공고” 우선 → plain text만 모으고 link/pdf 등 비텍스트는 건너뛰기. 토글 없으면 heading/paragraph 전체를 3~4k chars로 컷.
- [ ] 토큰 절약 전처리: 연속 paragraph 병합, trim/중복 문장 제거, 빈 라인 제거. 캐시: 동일 pageId 재조회 시 블록 재호출 없이 메모리/kv 반환.
- [ ] 에러/빈 데이터 UX: 공고 토글 없거나 텍스트 0자면 “공고 내용이 비어있습니다” 메시지로 안내, 재시도/다른 페이지 검색 유도.
- [ ] 테스트: a) query payload에 contains 필터 포함, b) 공고 토글 선택/없을 때 fallback, c) 빈 결과 에러 메시지, d) 캐시 사용 시 블록 호출 1회만 되는지.

### phase 15.2 지원자격 요약/응답
- [ ] 요약 프롬프트 확정: “입력은 plain text. 지원자격/요구사항만 5 bullets, 한국어, 120 tokens 이내, 불필요한 서론 금지.”로 고정.
- [ ] 파이프라인: 검색어에 “지원자격/요구/조건” 포함 시 공고 텍스트 → LLM 요약 → UI 결과 패널에 bullet 렌더. 토글 텍스트 없으면 DB `요약` 필드 사용(없으면 에러 반환).
- [ ] UI 문구: 결과 패널 상단에 “프로젝트 DB·공고 토글 기반 요약” 메타 표시, 실패 시 명확한 원인(페이지 없음/공고 비어 있음/LLM 실패).
- [ ] 테스트: 요약 프롬프트에 투입되는 텍스트 길이 제한 적용, 지원자격 키워드 입력 시 LLM 호출 1회, fallback(요약 필드) 시에도 bullet 출력 확인.
