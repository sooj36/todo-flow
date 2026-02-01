<img width="1024" height="547" alt="image" src="https://github.com/user-attachments/assets/38e988ca-da1c-49b0-979e-ca715a375cba" />


## 프로젝트 소개 
- 반복 작업을 하루 단위의 실체로 만들어 FlowBoard에서 진행을 체크하고, 완료 결과를 캘린더에 누적해 보여주는 시각적 생산성 시스템입니다.


## 주요 기능
- 반복 task를 하루 인스턴스로 생성하고, flow-step 진행을 화면 오른쪽 FlowBoard에서 시각화
- 왼쪽 캘린더 화면에 완료 누적/채움도 표시
- Notion 템플릿-스텝-인스턴스 DB와 양방향 연동, 수동 동기화 및 생성 플로우
- 검색창 입력 -> Notion 프로젝트 페이지 조회 -> LLM이 핵심 요약/포인트 자동 추출

## 기술 스택
  - Next.js 14 (App Router)
  - React 18
  - TypeScript
  - Tailwind CSS v4
  - Notion API (@notionhq/client)
  - Google Gemini SDK (@google/generative-ai)
  - React Flow
  - Zod
  - Vitest + Testing Library
  - ESLint (Next.js config)

## 문서 맵
- `docs/PRD.md` 제품 요구사항
- `docs/spec.md` 상세 스펙
- `docs/COMPONENTS.md` 컴포넌트 목록
- `docs/prompt_plan.md` 프롬프트 계획
- `docs/pre_prompt_plan.md` 사전 프롬프트 계획
- `docs/log.md` 작업 로그
- `docs/CLAUDE.md` Claude 노트

--

<img width="1486" height="808" alt="image" src="https://github.com/user-attachments/assets/2cbf9770-1a99-40e4-902c-7068926aa192" />
