# Flow Planner

Task 시각화 생산성 앱. Notion을 Single Source of Truth로 사용.

## Docs Map

- docs/PRD.md: 제품 비전/사용자 흐름/범위 정의
- docs/spec.md: 구현 스펙, 아키텍처, 제약 조건
- docs/DATA_MODEL.md: 타입/Notion 스키마 설계 (Phase 2 대비)
- docs/COMPONENTS.md: 컴포넌트 역할/구성 정리
- docs/prompt_plan.md: 작업 규칙 및 진행 체크리스트
- docs/log.md: 작업 로그 및 테스트 결과 기록

## Commands

```bash
pnpm install          # 의존성 설치
pnpm dev              # 개발 서버 (기본 localhost:3000)
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint 실행
pnpm test             # Vitest (watch)
pnpm test:run         # Vitest (run)
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript strict mode
- Tailwind CSS
- Lucide React (icons)
- Vitest + Testing Library + jsdom
- @notionhq/client (Phase 2)

## Structure

```
app/                      # Next.js App Router
├── page.tsx              # 메인 대시보드
└── api/notion/           # API routes (Phase 2)
components/
├── layout/               # Sidebar, NavItem
├── calendar/             # NotionCalendar
└── flow/                 # FlowBoard
```

## Conventions

- 컴포넌트: `export const Name: React.FC<Props> = () => {}`
- 2 spaces, semicolons required
- imports: react → external → @/ → relative
- Tailwind order: layout → size → text → color → effect

## DO NOT

- `any` 타입 → 명시적 타입 정의
- inline styles → Tailwind only
- console.log 커밋
- 컴포넌트에서 직접 fetch → custom hooks

## Phase 2 Tasks

- [ ] Notion API 연결 (calendar/database ID 입력 흐름)
- [ ] 데이터 로딩/에러/빈 상태 분기
- [ ] 캘린더 이벤트 렌더링
- [ ] FlowBoard 데이터 바인딩
- [ ] E2E 테스트 추가 및 유지

