# plan_b.md - AI Agent MVP Implementation Plan

## Goal
- 프로젝트에 "AI Agent" 기능이 실제로 추가됐다고 말할 수 있는 최소 동작(MVP) 구현
- 입력 -> 판단 -> 결과 UI 반영까지 end-to-end 흐름 제공

## Scope (MVP)
- UI: "AI Agent (Auto Triage)" 버튼 + 실행 결과 패널
- 로직: mock 기반 에이전트 실행 (임시 데이터로 결과 생성)
- 상태: 실행 중/성공/실패 상태 표시
- 제한: 실제 LLM/외부 API 연동은 제외

## Phase A - UI Entry Point
- [ ] FlowBoard 또는 Calendar 옆에 "AI Agent" 버튼 추가
- [ ] 실행 상태 표시 (idle / running / success / error)
- [ ] 결과 패널 placeholder 추가 (요약 + 변경 리스트)

## Phase B - Agent Orchestration (Mock)
- [ ] `useAgentAutoTriage` 훅 추가
- [ ] mock 입력: 현재 selectedDate + 샘플 tasks
- [ ] mock 출력: 충돌/미완료/연기 제안 리스트 생성
- [ ] 실행 결과를 UI 패널에 바인딩

## Phase C - Persistence (Optional for MVP+)
- [ ] 결과를 local state에 유지
- [ ] "적용" 버튼은 비활성 또는 안내 텍스트로만 노출

## Phase D - Verification
- [ ] Manual: 버튼 클릭 시 로딩 상태 표시
- [ ] Manual: 결과 패널에 요약/항목 표시 확인
- [ ] Test: hook 단위 테스트 (mock 결과 반환)
- [ ] Test: UI 통합 테스트 (버튼 클릭 -> 결과 렌더링)

## Notes
- 실제 LLM 연동은 "Future Extension"으로 분리
- MVP 완료 후에는 README에 "AI Agent MVP added" 문구 추가 가능
