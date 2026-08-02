---
title: 'CI That Doesn''t Suck: Build a Pipeline That Catches Real Bugs Before You Merge'
date: '2026-07-28'
tags:
  - ci-cd
  - github-actions
  - docker
  - testing
  - security
  - typescript
description: >-
  Stop treating CI as a checkbox. Build a GitHub Actions pipeline with linting, type-checking, contract tests, and security scanning that runs in under 3 minutes and actually prevents production incidents.
---

Your CI pipeline is lying to you. That green checkmark? It means 'nothing exploded in the last 47 minutes,' not 'your code works.' I've watched teams merge broken migrations, ship SQL injection vulnerabilities, and deploy memory leaks — all under a cheerful 'All checks passed' banner. The problem isn't CI; it's that most pipelines are theater. They run `npm test` on a sqlite in-memory database and call it a day. Real CI catches the bug you *didn't* write a test for. It fails when your dependency tree pulls in a malicious package. It screams when your API contract drifts. Last month I wired up proper pipelines for four repos — a Next.js frontend, a NestJS API, a Python worker, and a Go sidecar. First run caught three production bugs, a hardcoded secret, and a type error that would've nuked the payments table. This post shows you the exact GitHub Actions workflows, the Docker Compose test harness, and the one weird trick that keeps the whole thing under three minutes. No YAML templating engines. No 'enterprise' SaaS upsells. Just config you can drop in today.

## The Anatomy of a Pipeline That Earns Its Keep

Most pipelines are a linear list of `npm test` and a prayer. A pipeline that earns its keep is a DAG — directed acyclic graph — where each stage gates the next and catches a distinct class of failure. Skip one, and you're not "moving fast"; you're borrowing time from production.

```mermaid
graph TD
    A[Checkout] --> B[Static Analysis]
    B --> C[Contract Validation]
    C --> D[Integration Tests]
    D --> E[Security Scan]
    E --> F[Build Artifacts]
    style B fill:#ff6b6b,color:#fff
    style C fill:#4ecdc4,color:#fff
    style D fill:#ffe66d,color:#000
    style E fill:#95e1d3,color:#000
```

**Stage 1: Static Analysis — the cheap gate.** Lint, type-check, and secrets detection run first because they're fast and catch the stupid stuff before you spin up containers. ESLint with `plugin:@typescript-eslint/recommended-type-checked` catches `any` leakage. `tsc --noEmit` verifies types without emitting JS. `gitleaks detect --source=. --verbose` finds the AWS key you pasted in `config.local.ts` at 2 AM. These run in parallel — 45 seconds total on a fresh runner.

```yaml
# .github/workflows/ci.yml (excerpt)
static-analysis:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '20', cache: 'npm' }
    - run: npm ci
    - run: npx eslint . --ext .ts,.tsx --max-warnings=0
    - run: npx tsc --noEmit
    - run: npx gitleaks detect --source=. --verbose --no-git
```

**Stage 2: Contract Validation — the handshake check.** Your OpenAPI spec is the source of truth. `spectral lint` validates the spec itself. `pact-verifier` (or `dredd` for OpenAPI) runs provider-side contract tests against a real stubbed API. This catches drift: renamed fields, missing required params, enum changes that your unit tests mock right past. Runs in 30 seconds against a `prism` mock server in a sidecar container.

**Stage 3: Integration Tests — real dependencies, no mocks.** Spin Postgres, Redis, Kafka, and your actual service containers via Docker Compose. Run migrations. Hit real endpoints. This catches the migration that works on SQLite but deadlocks on Postgres, the Redis key expiry bug, the Kafka consumer group rebalance storm. Target: under 90 seconds with `tmpfs` mounts and `--parallel`.

**Stage 4: Security Scan — the paranoid layer.** `trivy fs --severity HIGH,CRITICAL .` scans your repo and built image. `npm audit --audit-level=high` (or `pip-audit`, `govulncheck`) blocks known CVEs in dependencies. `semgrep --config=auto` catches SAST patterns your linter misses: hardcoded crypto, path traversal, SSRF vectors. This runs last because it's slowest — but if it fails, nothing ships.

Each stage fails fast, logs artifacts, and tells you *why* — not just "tests failed." The DAG ensures you never run integration tests on code that doesn't type-check, and never scan an image that didn't pass contracts.

## GitHub Actions Workflow: The Main Event

Here's the complete workflow. It lives at `.github/workflows/ci.yml` and replaces the "run everything on every push" cargo cult with a DAG that respects your time.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  # Single source of truth for service versions
  POSTGRES_VERSION: 16-alpine
  REDIS_VERSION: 7-alpine
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.12'
  GO_VERSION: '1.22'

jobs:
  # ──────────────────────────────────────────────────────────────
  # Detect what actually changed — skip irrelevant toolchains
  # ──────────────────────────────────────────────────────────────
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      node: ${{ steps.filter.outputs.node }}
      python: ${{ steps.filter.outputs.python }}
      go: ${{ steps.filter.outputs.go }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # needed for dorny/paths-filter
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            node:
              - 'apps/frontend/**'
              - 'packages/ui/**'
              - 'package.json'
              - 'pnpm-lock.yaml'
            python:
              - 'apps/worker/**'
              - 'requirements*.txt'
              - 'pyproject.toml'
            go:
              - 'apps/sidecar/**'
              - 'go.mod'
              - 'go.sum'

  # ──────────────────────────────────────────────────────────────
  # Node matrix: lint → typecheck → unit → contract
  # ──────────────────────────────────────────────────────────────
  node-ci:
    needs: detect-changes
    if: needs.detect-changes.outputs.node == 'true'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:${{ env.POSTGRES_VERSION }}
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports: [5432:5432]
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=5s
          --health-timeout=3s
          --health-retries=10
      redis:
        image: redis:${{ env.REDIS_VERSION }}
        ports: [6379:6379]
        options: --health-cmd="redis-cli ping" --health-interval=5s --health-timeout=3s --health-retries=10
    strategy:
      matrix:
        node-version: [20, 22]  # test LTS + current
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
          run_install: false
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
          cache-dependency-path: pnpm-lock.yaml
      - name: Install deps (frozen lockfile)
        run: pnpm install --frozen-lockfile
      - name: Lint
        run: pnpm lint
      - name: Typecheck
        run: pnpm typecheck
      - name: Unit tests
        run: pnpm test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      - name: Contract tests
        run: pnpm test:contract
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

  # ──────────────────────────────────────────────────────────────
  # Python matrix: ruff → mypy → pytest with real Postgres
  # ──────────────────────────────────────────────────────────────
  python-ci:
    needs: detect-changes
    if: needs.detect-changes.outputs.python == 'true'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:${{ env.POSTGRES_VERSION }}
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports: [5432:5432]
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=5s
          --health-timeout=3s
          --health-retries=10
    strategy:
      matrix:
        python-version: ['3.11', '3.12']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'
          cache-dependency-path: |
            apps/worker/requirements.txt
            apps/worker/requirements-dev.txt
      - name: Install deps
        run: |
          pip install -r apps/worker/requirements.txt
          pip install -r apps/worker/requirements-dev.txt
      - name: Ruff (lint + format check)
        run: ruff check apps/worker && ruff format --check apps/worker
      - name: Mypy
        run: mypy apps/worker
      - name: Pytest
        run: pytest apps/worker/tests -v --tb=short
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  # ──────────────────────────────────────────────────────────────
  # Go: golangci-lint → test with race detector
  # ──────────────────────────────────────────────────────────────
  go-ci:
    needs: detect-changes
    if: needs.detect-changes.outputs.go == 'true'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:${{ env.POSTGRES_VERSION }}
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports: [5432:5432]
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=5s
          --health-timeout=3s
          --health-retries=10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true
          cache-dependency-path: apps/sidecar/go.sum
      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: latest
          working-directory: apps/sidecar
      - name: Go test (race + coverage)
        run: go test -race -coverprofile=coverage.out ./...
        working-directory: apps/sidecar
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  # ──────────────────────────────────────────────────────────────
  # Security scan runs on every PR — cheap insurance
  # ──────────────────────────────────────────────────────────────
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trivy filesystem scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
      - name: Gitleaks secret scan
        uses: gitleaks/gitleaks-action@v2
```

The `detect-changes` job uses `dorny/paths-filter` — the only third-party action here — to compute a change map once. Downstream jobs gate on `if:` expressions so a typo in `apps/frontend` never triggers the Go linter. Service containers spin up Postgres 16 and Redis 7 with health checks; no more flaky "connection refused" on the first test run. Caching uses explicit `cache-dependency-path` pointing at lockfiles, not the cargo-cult `~/.cache/pip` that invalidates on every `pip install`. The `security` job runs unconditionally — Trivy catches vulnerable dependencies, Gitleaks catches the AWS key you accidentally committed. Total runtime: ~2m 40s on a clean cache, ~45s warm.

## Docker Compose Test Harness: Real Services, No Mocks

Mocks lie. They return happy-path JSON while your production Postgres deadlocks on a missing index. Spin real services in CI — it's faster than debugging a flaky test suite at 2 AM.

```yaml
# docker-compose.ci.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    tmpfs: /var/lib/postgresql/data
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test -d app"]
      interval: 500ms
      timeout: 1s
      retries: 20

  redis:
    image: redis:7-alpine
    tmpfs: /data
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 500ms
      timeout: 1s
      retries: 20

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    tmpfs: /data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 1s
      timeout: 2s
      retries: 20

  localstack:
    image: localstack/localstack:3
    tmpfs: /var/lib/localstack
    environment:
      SERVICES: s3,sqs,dynamodb
      DEBUG: 1
    ports: ["4566:4566"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_localstack/health"]
      interval: 1s
      timeout: 2s
      retries: 30
```

`tmpfs` mounts keep data in RAM — no disk I/O, no cleanup. Healthchecks with sub-second intervals mean the stack is ready in ~12 seconds on GitHub's runners. LocalStack takes the longest; bump its retries if you're on a slower machine.

Now the glue. Save this as `scripts/wait-for-services.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

services=("postgres:5432" "redis:6379" "minio:9000" "localstack:4566")

for svc in "${services[@]}"; do
  host="${svc%:*}"
  port="${svc#*:}"
  echo "Waiting for $host:$port..."
  timeout 60 bash -c "until nc -z $host $port; do sleep 0.2; done"
done
echo "All services ready."
```

Make it executable (`chmod +x scripts/wait-for-services.sh`). The `nc` (netcat) check is lighter than `curl` and ships in the runner image.

Test helper — drop this in `tests/helpers/setup.ts` (adapt for your language):

```typescript
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function setupTestDb() {
  // Run migrations against the CI postgres
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: 'postgresql://test:test@localhost:5432/app' } });

  // Seed deterministic data — same IDs, same timestamps, every run
  await prisma.user.createMany({
    data: [
      { id: 'usr_test_admin', email: 'admin@test.local', role: 'ADMIN', createdAt: new Date('2024-01-01T00:00:00.000Z') },
      { id: 'usr_test_viewer', email: 'viewer@test.local', role: 'VIEWER', createdAt: new Date('2024-01-01T00:00:00.000Z') },
    ],
    skipDuplicates: true,
  });
}

export async function teardownTestDb() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" RESTART IDENTITY CASCADE');
  await prisma.$disconnect();
}
```

Run `setupTestDb()` in your test suite's `beforeAll`, `teardownTestDb()` in `afterAll`. No `sqlite` in-memory nonsense — your queries hit the same planner, same indexes, same locking behavior as production. If a migration breaks, CI catches it. If a query plan regresses, CI catches it. That's the job.

## Contract Testing: Stop Breaking Your Frontend

Your frontend expects `user.email` to be a string. Your API just changed it to `null` because "the business said some users don't have emails." Your tests pass. The deploy succeeds. The dashboard whitescreens. Contract testing catches this before the PR merges — no Pact Broker, no extra infrastructure, just artifacts passed between workflow jobs.

### API Side: Generate and Publish the Contract

Add Pact to your NestJS (or Express, Fastify, whatever) test suite. Write a provider test that spins up your real app, hits real endpoints, and verifies the contract matches what consumers expect.

```typescript
// test/contract/provider.test.ts
import { Test } from '@nestjs/testing';
import { Verifier } from '@pact-foundation/pact';
import { AppModule } from '../../src/app.module';

describe('Provider Contract Verification', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates against published contracts', async () => {
    await new Verifier({
      providerBaseUrl: 'http://localhost:3000',
      pactUrls: ['../pacts/frontend-api.json'], // downloaded artifact
      providerVersion: process.env.GITHUB_SHA,
      publishVerificationResult: false, // we'll handle publishing separately
    }).verifyProvider();
  });
});
```

Run it in CI with a job that downloads the consumer contract first:

```yaml
# .github/workflows/ci.yml (API repo)
contract-test:
  needs: [lint, typecheck, unit-test]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/download-artifact@v4
      with:
        name: frontend-contract
        path: pacts
    - name: Install deps
      run: npm ci
    - name: Start test DB
      run: docker compose -f docker-compose.ci.yml up -d postgres
    - name: Run contract verification
      run: npm run test:contract
    - name: Upload verification result
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: contract-verification
        path: pacts/verification-results.json
```

### Frontend Side: Generate the Consumer Contract

Your frontend tests define what they *expect* from the API. Pact records these interactions and spits out a JSON contract.

```typescript
// frontend/__tests__/contract/api.consumer.test.ts
import { Pact } from '@pact-foundation/pact';
import { fetchUser } from '@/lib/api';

const provider = new Pact({
  consumer: 'frontend',
  provider: 'api',
  port: 1234,
  logLevel: 'warn',
  dir: './pacts',
});

describe('API Contract', () => {
  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());

  it('returns user with email string', async () => {
    await provider.addInteraction({
      state: 'user exists',
      uponReceiving: 'a request for user',
      withRequest: { method: 'GET', path: '/users/1' },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { id: 1, email: 'user@example.com', name: 'Test User' },
      },
    });

    const user = await fetchUser(1);
    expect(user.email).toBeTypeOf('string');
  });
});
```

Publish the contract as an artifact for the API repo to consume:

```yaml
# .github/workflows/ci.yml (Frontend repo)
generate-contract:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm run test:contract  # generates pacts/frontend-api.json
    - uses: actions/upload-artifact@v4
      with:
        name: frontend-contract
        path: pacts/*.json
        retention-days: 7
```

### The Cross-Repo Dance

Two repos, one source of truth. The frontend workflow runs on every PR, uploads `frontend-contract`. The API workflow triggers on the same PR (via `workflow_dispatch` or a scheduled sync), downloads that artifact, verifies against its current code. Breaking change? The provider verification fails. Red checkmark. No merge.

No broker to maintain. No versioning headaches. Just `upload-artifact` / `download-artifact` and a shared understanding that contracts live in the consumer repo — because *they* define what they need.

## Security Scanning That Doesn't Drown You in Noise

Most security scanners are noisy toddlers — they scream about a LOW-severity regex DoS in a dev dependency you haven't touched since 2019. You ignore them. Then a CRITICAL RCE slips through because the alert fatigue was real. Let's fix the signal-to-noise ratio.

### Container Scanning with Trivy

Trivy scans your built image, not the Dockerfile. That matters — it catches vulnerabilities pulled in at build time, not just what you declared.

```yaml
# .github/workflows/ci.yml (job: security)
trivy:
  runs-on: ubuntu-latest
  needs: build
  steps:
    - uses: actions/checkout@v4
    - name: Download built image
      uses: actions/download-artifact@v4
      with:
        name: app-image
        path: /tmp/image
    - name: Load image
      run: docker load -i /tmp/image/app.tar
    - name: Run Trivy
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'localhost/app:ci'
        format: 'sarif'
        output: 'trivy.sarif'
        severity: 'HIGH,CRITICAL'
        ignore-unfixed: true
        vuln-type: 'os,library'
    - name: Upload SARIF
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: trivy.sarif
        category: container
```

`ignore-unfixed: true` is the secret sauce — it skips vulnerabilities with no patch yet, so you're not blocked on upstream maintainers. `vuln-type: 'os,library'` skips config-audit noise (like "root user in container") that belongs in your Dockerfile linter, not the vuln scanner.

### Dependency Scanning: One Flag Per Ecosystem

```yaml
deps:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Node audit
      if: hashFiles('package-lock.json') != ''
      run: |
        npm audit --audit-level=high --json > npm-audit.json || true
        npx @cyclonedx/bom -o bom.xml --json npm-audit.json
    - name: Python audit
      if: hashFiles('requirements.txt') != ''
      run: |
        pip install pip-audit
        pip-audit -r requirements.txt --format=json --output=pip-audit.json || true
    - name: Go audit
      if: hashFiles('go.sum') != ''
      run: |
        go install golang.org/x/vuln/cmd/govulncheck@latest
        govulncheck -json ./... > govulncheck.json || true
    - name: Convert to SARIF
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const { Sarif } = require('@github/sarif');
          // ... conversion logic (see gist.github.com/lacorte/convert-audit-to-sarif)
    - name: Upload SARIF
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: combined.sarif
        category: dependencies
```

The `|| true` prevents the job from failing on findings — SARIF upload handles the gating. GitHub's security tab now shows a 7-day grace period for existing alerts automatically. New HIGH/CRITICAL findings block the PR; old ones just nag you.

### Secrets: Gitleaks with Inline Suppression

```yaml
secrets:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - name: Gitleaks
      uses: gitleaks/gitleaks-action@v2
      env:
        GITLEAKS_CONFIG: |
          [allowlist]
          description = "Test fixtures"
          paths = ["**/*_test.go", "**/fixtures/**"]
          [[allowlist.regexes]]
          description = "Example API key in docs"
          regex = '''EXAMPLE_KEY_[A-Z0-9]{32}'''
      with:
        args: '--verbose --sarif=gitleaks.sarif'
    - name: Upload SARIF
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: gitleaks.sarif
        category: secrets
```

The `GITLEAKS_CONFIG` env var embeds your allowlist *in the workflow* — no separate `.gitleaks.toml` to drift out of sync. Test fixtures, example keys in docs, that one hardcoded JWT in `mocks/auth.go` — suppress them inline with a comment explaining why. Future you will thank present you when the audit log shows *why* that rule exists.

### The Grace Period Is Automatic

GitHub's code scanning alerts UI handles the 7-day grace period for you. When a new HIGH/CRITICAL finding appears on `main`, it shows "Introduced 3 days ago." After 7 days on `main` without fix, it becomes a "persistent" alert and starts failing PRs that touch the affected file. No cron jobs, no external dashboards, no "security team will review" theater.

Run `gh api repos/:owner/:repo/code-scanning/alerts --jq '.[] | select(.state=="open") | {rule: .rule.id, severity: .rule.severity, file: .most_recent_instance.location.path}'` to audit what's actually open. You'll be surprised how fast the list shrinks when the noise stops.

## Speed Runs: Keeping It Under Three Minutes

Your pipeline is slow because you're rebuilding the universe on every commit. Stop it. Profile first — `act` runs the workflow locally with the same Docker images GitHub uses, minus the queue time.

```bash
act push --container-architecture linux/amd64 \
  --secret-file .env.ci \
  -v
```

The `-v` flag mounts your repo read-only so you can iterate on the YAML without pushing. When the local run looks clean, ship it and audit the real thing:

```bash
gh run view --log --repo owner/repo --json conclusion,createdAt,updatedAt,jobs
```

Three optimizations shaved 12 minutes off my cold run. First, **pnpm workspace caching with Turborepo**. The default `actions/cache` key is a hash of `pnpm-lock.yaml` — fine for a single package, useless for a monorepo where `packages/ui` changes but `packages/api` doesn't. Turbo computes a content hash per package and only restores what's affected.

```yaml
# .github/workflows/ci.yml
- name: Cache turbo build cache
  uses: actions/cache@v4
  with:
    path: |
      .turbo
      node_modules
      **/node_modules
    key: turbo-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ hashFiles('**/turbo.json') }}
    restore-keys: |
      turbo-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}-
```

Pair it with `turbo run build test --filter=...[origin/main]` in the job step. Turbo skips packages untouched since `main` — no `if: github.event_name == 'pull_request'` gymnastics required.

Second, **split the matrix by affected packages** using `dorny/paths-filter`. Your 12-package monorepo doesn't need 12 test jobs when only `packages/billing` changed.

```yaml
- name: Filter changed packages
  id: filter
  uses: dorny/paths-filter@v3
  with:
    filters: |
      api:
        - 'packages/api/**'
      ui:
        - 'packages/ui/**'
      worker:
        - 'packages/worker/**'
      shared:
        - 'packages/shared/**'

- name: Test matrix
  if: steps.filter.outputs.any_changed == 'true'
  uses: ./.github/actions/test-package
  with:
    package: ${{ matrix.package }}
  strategy:
    matrix:
      package: ${{ fromJson(steps.filter.outputs.changed_packages) }}
    fail-fast: false
```

The composite action `.github/actions/test-package/action.yml` runs `pnpm --filter=${{ inputs.package }} test` inside the Docker Compose harness. Untouched packages = zero runner minutes.

Third, **replace sequential `docker build` with `docker buildx bake`** for parallel multi-arch images. The old way: build `api`, wait, build `worker`, wait, push both. Bake reads a HCL file and builds all targets concurrently on BuildKit.

```hcl
# docker-bake.hcl
group "default" {
  targets = ["api", "worker", "sidecar"]
}

target "api" {
  dockerfile = "packages/api/Dockerfile"
  context = "."
  tags = ["ghcr.io/owner/api:${VERSION}"]
  platforms = ["linux/amd64", "linux/arm64"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
}

target "worker" {
  dockerfile = "packages/worker/Dockerfile"
  context = "."
  tags = ["ghcr.io/owner/worker:${VERSION}"]
  platforms = ["linux/amd64", "linux/arm64"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
}
```

```yaml
- name: Build and push images
  uses: docker/build-push-action@v6
  with:
    context: .
    file: docker-bake.hcl
    push: true
    load: false
```

BuildKit's cache export/import (`type=gha`) means layer reuse across runs — no more `docker pull` warmup dance.

### Onboard a New Repo in 10 Minutes Checklist

- [ ] `cp -r .github/workflows/ci.yml .github/actions/ docker-compose.ci.yml docker-bake.hcl turbo.json .`
- [ ] `pnpm add -D turbo @types/node typescript` (or your language equivalent)
- [ ] Edit `turbo.json` pipeline: `build`, `test`, `lint`, `typecheck` tasks with `dependsOn`
- [ ] Add `dorny/paths-filter` filters matching your package globs
- [ ] Run `act push -v` — fix missing secrets, volume mounts, service healthchecks
- [ ] Push to a test branch, watch `gh run view --log` for the first green DAG
- [ ] Delete the old `npm test` workflow. Burn the `Dockerfile` that `COPY . .` — you have `docker-bake.hcl` now.

Three minutes. Green checks that mean something. Go merge something scary.
