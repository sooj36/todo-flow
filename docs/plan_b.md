## Goal

* “LLM SDK(Gemini) + Notion API + Next.js UI”를 **하나의 사용자 플로우로 완주**시키는 구현 경험 확보
* 사용자가 자연어로 요청하면, 시스템이 Notion에서 대상 페이지를 자동 수집하고 Gemini로 분석해 **공통 키워드 클러스터**를 생성하여 UI에 반환

## Success Criteria (MVP 완료 정의)

* 사용자가 검색창에 1줄 입력 → 10초 이내 결과 패널에 **클러스터(주제/키워드 묶음)** 가 표시됨
* 결과는 **구조화(JSON) + 검증(zod)** 을 거쳐 UI에 안정적으로 렌더링됨
* Notion에서 “키워드 추출 완료” 대상 페이지를 **필터로 정확히 조회**한다
* 진행 단계 표시(조회/분석/완료)가 항상 노출된다 (10초 대기 UX 필수)

---

## Scope (MVP)

* UI

  * 검색창 1개 + 실행(Enter) + 결과 패널
  * 상태 표시: idle / running / success / error
* Backend

  * Notion Query로 “키워드 추출 완료” 페이지 목록 조회
  * 페이지별 “키워드 원천”만 수집(키워드 속성 우선)
  * Gemini 호출로 공통 키워드 클러스터 생성(구조화 출력)
* 제한

  * **Notion에 저장(쓰기)** 은 MVP+로 분리 (읽기/분석까지만)
  * “캘린더 UI와의 결합”은 선택 (일단 DB 필터 기반으로 구현)
  * 검색 입력은 초기엔 “실행 트리거 + 선택적 필터”로 제한 (아래 Phase C에서 명시)

---

## 핵심 설계 원칙 (다시 생각한 포인트)

1. **LLM이 Notion을 직접 탐색하지 않는다.**

   * 앱이 Notion에서 “키워드만” 추출해 LLM에 준다.
2. **MVP는 “키워드 필드가 존재한다”를 전제로 단일 패스로 끝낸다.**

   * 본문 기반 1차 키워드 추출(Map 단계)은 확장으로 둔다.
3. **결과는 항상 구조화 JSON으로 고정한다.**

   * “텍스트 요약”이 아니라 “클러스터 오브젝트”가 산출물이다.

---

## Data Contract (Notion 최소 전제)

* DB에는 최소 2개 속성이 필요

  1. `키워드 추출` : 완료 여부 (checkbox 또는 status)
  2. `키워드` : 페이지별 추출 결과 (multi-select 또는 text)
* MVP에서는 “키워드” 속성이 비어있는 페이지는 제외하거나 “불완전 데이터”로 표시
* Cold start 대비: 최소 3~5개 페이지에 키워드를 수동 입력하도록 가이드 메시지 제공

---

## Output Contract (LLM 결과 스키마)

* UI가 그대로 렌더링 가능한 형태로 고정

```json
{
  "meta": { "pageCount": 12, "keywordCount": 86, "clusterCount": 6 },
  "clusters": [
    {
      "label": "채용/이력서",
      "keywords": ["JD 분석", "키워드 매핑", "STAR"],
      "pageRefs": [{ "pageId": "xxx", "title": "이력서 작성 템플릿" }]
    }
  ],
  "topKeywords": [
    { "keyword": "JD 분석", "count": 7, "pageIds": ["a","b"] }
  ],
  "normalizationNotes": ["동의어 통합 규칙", "표기 통일 규칙"]
}
```

---

## Phase A — UI Entry Point (검색창 + 결과 패널)

* [ ] 캘린더/보드 상단에 검색창 추가 (placeholder 예: “예: 키워드 추출 완료된 페이지 요약”)
* [ ] Enter로 실행 (`/api/agent/keywords`) 호출
* [ ] 상태 UI: idle/running/success/error
* [ ] 결과 패널(초기 비어있음) 구성

  * 요약(meta)
  * clusters 리스트(접기/펼치기)
  * topKeywords 리스트(빈도순)
* [ ] 진행 단계 표시(필수): 조회/정규화/클러스터링/완료

**Acceptance**

* 입력 후 로딩 상태가 즉시 표시되고, 완료 시 결과가 패널에 렌더링된다.

---

## Phase B — Notion Retrieval (정확히 “키워드 추출 완료”만)

* [ ] Notion Query 함수 구현 `getCompletedKeywordPages(queryText?: string)`

  * 필터: `키워드 추출 == true` 또는 `status == 완료`
  * 정렬: 최근 업데이트 순
  * 제한: `limit = 20` (토큰/비용 안정화, 1차 MVP 한계로 명시)
* [ ] 페이지 데이터 정규화

  * `pageId`, `title`, `keywords[]`만 추출
  * keywords 정제: trim/중복 제거/빈 값 제거
* [ ] queryText 사용(선택): title/keywords에 간단한 포함 필터(부분 일치) 적용

**Failure Modes**

* [ ] 완료 페이지가 0개면: “완료된 페이지가 없습니다” 에러 메시지
* [ ] 키워드 속성이 없는 페이지가 다수면: “키워드 속성 설정 필요” + 예시 입력 안내

---

## Phase C — Gemini Orchestration (Free Tier + 구조화 출력)

* [ ] 서버 라우트 구현: `POST /api/agent/keywords`

  * input: `{ queryText: string }` (선택 필터로 사용, 미입력 시 전체)
  * 내부 처리:

    1. Notion에서 pages 가져오기
    2. pages를 Gemini에 전달하여 클러스터링
    3. 결과 JSON을 zod로 검증 후 반환
* [ ] 프롬프트 최소화(비용/안정성)

  * “아래 pages[].keywords를 동의어/표기 통일 후, 의미 단위로 5~8개 클러스터로 묶어라”
  * “반드시 지정된 JSON 스키마로만 출력하라”
* [ ] 출력 검증 실패 시 fallback

  * 1차: Gemini 재시도(1회)
  * 2차: LLM 없이 빈도 집계(topKeywords만)라도 반환하여 UI는 깨지지 않게

**Acceptance**

* 동일 입력에 대해 결과 형태가 항상 동일 스키마로 내려온다(렌더링 안정성).
* 예상 토큰/성능 범위를 문서에 명시 (예: 20페이지, 2k~4k tokens, 3~5초)

---

## Performance & Cost Notes

### 토큰 사용량 추정

| 항목 | 추정값 | 비고 |
|------|--------|------|
| 페이지당 평균 토큰 | 100~200 tokens | title + keywords 기준 |
| 20페이지 입력 | 2,000~4,000 tokens | 시스템 프롬프트 포함 |
| 응답 토큰 | 500~1,000 tokens | JSON 구조화 출력 |
| 총 예상 | 2,500~5,000 tokens/요청 | 안전 마진 포함 |

### 응답 시간 목표

| 단계 | 목표 시간 | 설명 |
|------|-----------|------|
| Notion 조회 | 0.5~1초 | 20페이지 limit |
| Gemini 클러스터링 | 2~3초 | Flash 모델 기준 |
| 전체 E2E | 3~5초 | 목표 응답 시간 |

### Gemini Free Tier 한도 (gemini-2.0-flash-exp)

| 제한 항목 | 한도 | 비고 |
|-----------|------|------|
| RPM (Requests Per Minute) | 10 | 분당 최대 요청 수 |
| TPM (Tokens Per Minute) | 4,000,000 | 분당 최대 토큰 수 |
| RPD (Requests Per Day) | 1,500 | 일일 최대 요청 수 |

### 비용 최적화 전략

1. **페이지 수 제한**: 20페이지로 limit하여 토큰 사용량 예측 가능
2. **Flash 모델 사용**: Pro 대비 빠른 응답, 무료 한도 내 충분
3. **구조화 출력**: JSON mode로 파싱 오류 최소화, 재시도 비용 절감
4. **Fallback 전략**: LLM 실패 시 빈도 집계로 대체하여 사용자 경험 유지

### Rate Limit 대응

- 현재 MVP 사용 패턴(수동 검색)에서는 RPM 한도 초과 가능성 낮음
- 향후 자동화/배치 처리 시 요청 간격 조절 또는 큐잉 필요
- 429 에러 발생 시 UI에 "잠시 후 다시 시도" 안내 표시

---

## Phase D — UX 강화 (필수: 에이전트 체감 포인트)

* [ ] 진행 단계 노출(텍스트로 충분)

  * “Notion에서 완료 페이지 조회 중…”
  * “키워드 정규화/클러스터링 중…”
  * “결과 생성 완료”
* [ ] 근거 제공(evidence)

  * 각 클러스터에 pageRefs 포함(최소 1개)
  * 사용자가 “왜 이 묶음?”을 납득 가능

---

## Phase E — MVP+ (선택) 결과 저장/반영

MVP가 끝난 뒤에만 추가:

* [ ] “Notion에 저장” 버튼

  * 새 페이지 생성(“공통 키워드 리포트”) + clusters 내용을 본문/속성에 기록
  * 또는 DB에 `공통 키워드(집계)` 속성을 만들어 업데이트
* [ ] 저장 전 확인(confirm) 모달(쓰기 작업 안전장치)

---

## Verification

* Manual

  * [ ] 완료된 페이지가 있을 때: 클러스터가 표시된다
  * [ ] 완료된 페이지가 없을 때: 명확한 안내가 뜬다
  * [ ] 키워드 속성이 비었을 때: 데이터 가이드가 뜬다
* Test (최소)

  * [ ] Notion query 함수 단위 테스트(필터 조건이 올바른지)
  * [ ] zod 스키마 검증 테스트(파싱 실패 시 fallback 동작)
  * [ ] UI 통합 테스트: 검색 입력 → 로딩 → 결과 렌더링 (mock API)

---
