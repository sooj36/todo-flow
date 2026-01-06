# Flow Planner

Task 시각화 생산성 앱. Notion을 Single Source of Truth로 사용.

## Commands

```bash
pnpm install          # 의존성 설치
pnpm dev              # 개발 서버 (localhost:3000)
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint 실행
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript strict mode
- Tailwind CSS
- Lucide React (icons)
- @notionhq/client (Phase 2)

## Structure

```
app/                      # Next.js App Router
├── page.tsx              # 메인 대시보드
└── api/notion/           # API routes (Phase 2)
components/
├── layout/               # Sidebar, NavItem
├── calendar/             # NotionCalendar, CalendarDay
├── flow/                 # FlowBoard, TaskCard
└── ui/                   # Button, Badge, ProgressBar
types/index.ts            # 모든 타입 정의
data/mock.ts              # 더미 데이터 (Phase 1)
```

## Conventions

- 컴포넌트: `export const Name: React.FC<Props> = () => {}`
- 2 spaces, semicolons required
- imports: react → external → @/ → relative
- Tailwind order: layout → size → text → color → effect

## DO NOT

- ❌ `any` 타입 → 명시적 타입 정의
- ❌ inline styles → Tailwind only
- ❌ console.log 커밋
- ❌ 컴포넌트에서 직접 fetch → custom hooks

## Phase 1 Tasks

- [ ] 프로젝트 초기화 (Next.js + Tailwind)
- [ ] types/index.ts
- [ ] data/mock.ts
- [ ] Sidebar + Layout
- [ ] NotionCalendar
- [ ] FlowBoard + TaskCard
- [ ] CreateTodayTaskModal

## Docs

@docs/PRD.md
@docs/DATA_MODEL.md
@docs/COMPONENTS.md
