# error.md - Known Issues & Solutions

## Memory

### Vitest OOM (Out of Memory) on Full Test Run

**증상**:
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
4058.9 MB -> 4050.9 MB (힙 4GB+ 사용)
```

**발생 조건**:
- `pnpm test:run` 전체 테스트 실행 시
- 개별 테스트 파일/폴더 실행 시에는 발생하지 않음

**원인 분석**:
1. **jsdom + forks 조합**: 21개 테스트 파일 × jsdom 환경 = 메모리 누적
2. **Vitest 기본 설정**: forks 모드로 병렬 실행 → 각 worker가 별도 Node.js 프로세스
3. **GC 비효율**: 병렬 프로세스들이 메모리를 공유하지 않아 GC가 효과 없음

**현재 vitest.config.ts**:
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    // pool 설정 없음 (기본값: forks, 병렬 실행)
  },
});
```

**해결 방법 (택 1)**:

#### Option A: 단일 프로세스 순차 실행 (메모리 최적화, 속도 느림)
```typescript
test: {
  pool: 'forks',
  poolOptions: {
    forks: {
      singleFork: true,
    },
  },
}
```

#### Option B: Worker 수 제한 (균형)
```typescript
test: {
  pool: 'forks',
  poolOptions: {
    forks: {
      maxForks: 2,
    },
  },
}
```

#### Option C: Node.js 메모리 한도 증가 (임시방편)
```bash
NODE_OPTIONS="--max-old-space-size=8192" pnpm test:run
```

#### Option D: threads 모드 사용 (메모리 공유)
```typescript
test: {
  pool: 'threads',
  poolOptions: {
    threads: {
      singleThread: true,
    },
  },
}
```

**권장**: Option B (maxForks: 2) - 적절한 병렬성 유지하면서 메모리 제한

**참고**:
- 개별 폴더 테스트는 정상: `pnpm test:run lib/agent/`
- 전체 테스트 (120개) 자체는 모두 통과, worker 크래시만 발생
