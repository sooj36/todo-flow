<img width="1024" height="547" alt="image" src="https://github.com/user-attachments/assets/38e988ca-da1c-49b0-979e-ca715a375cba" />


## 프로젝트 소개 
- 반복 작업을 하루 단위의 실체로 만들어 FlowBoard에서 진행을 체크하고, 완료 결과를 캘린더에 누적해 보여주는 시각적 생산성 시스템입니다.


## 주요 기능

## 기술 스택

<img width="1486" height="808" alt="image" src="https://github.com/user-attachments/assets/2cbf9770-1a99-40e4-902c-7068926aa192" />

## 스펙 요약
- 비전/기능: 반복 Task 시각화, Notion API 연동 예정. Phase 1은 UI/빈 상태, Phase 2는 Notion 연결/클라이언트 구성, Phase 3는 데이터 바인딩 및 E2E.
- 아키텍처: Next.js App Router, TypeScript strict. 데이터 흐름은 `useTaskTemplates` -> `useTaskInstances` 훅.
- UI/UX: 캘린더는 월을 1-15, 16-말일로 분할해 채움도 하이라이트. FlowBoard는 Phase 2에서 드래그 앤 드롭 지원. 연동 전엔 빈 상태 표시.
- 제약: `any` 금지, Tailwind만 사용. MVP는 cron/멀티유저 제외.
- 참고: `docs/PRD.md`, `docs/DATA_MODEL.md`, `docs/COMPONENTS.md`.

## 문서 맵
- `docs/PRD.md` 제품 요구사항
- `docs/spec.md` 상세 스펙
- `docs/COMPONENTS.md` 컴포넌트 목록
- `docs/prompt_plan.md` 프롬프트 계획
- `docs/pre_prompt_plan.md` 사전 프롬프트 계획
- `docs/log.md` 작업 로그
- `docs/CLAUDE.md` Claude 노트

