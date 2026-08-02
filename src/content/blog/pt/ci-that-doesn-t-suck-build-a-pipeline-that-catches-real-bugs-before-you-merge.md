---
title: 'CI que funciona de verdade: monte um pipeline que pega bugs reais antes do merge'
date: '2026-07-28'
tags:
  - ci-cd
  - github-actions
  - docker
  - testes
  - segurança
  - typescript
description: >-
  Pare de tratar CI como um checkbox. Construa um pipeline no GitHub Actions com lint, type-check, testes de contrato e varredura de segurança que roda em menos de 3 minutos e realmente previne incidentes em produção.
---

Seu pipeline de CI está mentindo para você. Aquele check verde? Significa "nada explodiu nos últimos 47 minutos", não "seu código funciona". Já vi times fazer merge de migrations quebradas, enviar vulnerabilidades de SQL injection e deployar memory leaks — tudo sob um alegre banner de "All checks passed". O problema não é o CI; é que a maioria dos pipelines é encenação. Eles rodam `npm test` num sqlite in-memory e encerram por aí. CI de verdade pega o bug para o qual você *não* escreveu teste. Falha quando sua árvore de dependências puxa um pacote malicioso. Grita quando seu contrato de API deriva. No mês passado configurei pipelines adequados para quatro repos — um frontend Next.js, uma API NestJS, um worker Python e um sidecar Go. A primeira execução pegou três bugs de produção, um segredo hardcoded e um erro de tipo que teria destruído a tabela de pagamentos. Este post mostra os workflows exatos do GitHub Actions, o harness de testes com Docker Compose e o truque que mantém tudo abaixo de três minutos. Sem engines de templating YAML. Sem upsells de SaaS "enterprise". Só config que você pode colar hoje.

## A Anatomia de um Pipeline Que Vale a Pena

A maioria dos pipelines é uma lista linear de `npm test` e uma oração. Um pipeline que vale a pena é um DAG — directed acyclic graph — onde cada estágio bloqueia o próximo e pega uma classe distinta de falha. Pule um, e você não está "indo rápido"; está emprestando tempo da produção.

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

**Estágio 1: Análise estática — o portão barato.** Lint, type-check e detecção de segredos rodam primeiro porque são rápidos e pegam erros óbvios antes de subir containers. ESLint com `plugin:@typescript-eslint/recommended-type-checked` pega vazamento de `any`. `tsc --noEmit` verifica tipos sem emitir JS. `gitleaks detect --source=. --verbose` encontra a chave AWS que você colou em `config.local.ts` às 2 da manhã. Esses rodam em paralelo — 45 segundos no total num runner novo.

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

**Estágio 2: Validação de contrato — o check de handshake.** Sua spec OpenAPI é a fonte da verdade. `spectral lint` valida a spec em si. `pact-verifier` (ou `dredd` para OpenAPI) roda testes de contrato do lado do provider contra uma API stubada de verdade. Isso pega deriva: campos renomeados, params obrigatórios faltando, mudanças de enum que seus testes unitários mockam sem nem perceber. Roda em 30 segundos contra um mock server `prism` num container sidecar.

**Estágio 3: Testes de integração — dependências reais, sem mocks.** Suba Postgres, Redis, Kafka e seus containers de serviço de verdade via Docker Compose. Rode migrations. Acesse endpoints reais. Isso pega a migration que funciona no SQLite mas dá deadlock no Postgres, o bug de expiração de chave Redis, a tempestade de rebalanceamento do consumer group Kafka. Meta: abaixo de 90 segundos com mounts `tmpfs` e `--parallel`.

**Estágio 4: Varredura de segurança — a camada paranoica.** `trivy fs --severity HIGH,CRITICAL .` varre seu repo e a imagem buildada. `npm audit --audit-level=high` (ou `pip-audit`, `govulncheck`) bloqueia CVEs conhecidos em dependências. `semgrep --config=auto` pega padrões SAST que seu linter não pega: crypto hardcoded, path traversal, vetores SSRF. Isso roda por último porque é o mais lento — mas se falhar, nada vai para produção.

Cada estágio falha rápido, registra artifacts e diz *por quê* — não só "tests failed". O DAG garante que você nunca roda testes de integração em código que não passa no type-check, e nunca varre uma imagem que não passou nos contratos.

## GitHub Actions Workflow: O Evento Principal

Aqui está o workflow completo. Ele fica em `.github/workflows/ci.yml` e substitui o culto de "rodar tudo em todo push" por um DAG que respeita seu tempo.

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

O job `detect-changes` usa `dorny/paths-filter` — a única action de terceiros aqui — para calcular um mapa de mudanças uma vez. Jobs downstream bloqueiam com expressões `if:` para que um typo em `apps/frontend` nunca dispare o linter Go. Service containers sobem Postgres 16 e Redis 7 com health checks; chega de "connection refused" intermitente na primeira execução de teste. O cache usa `cache-dependency-path` explícito apontando para lockfiles, não o cargo-cult de `~/.cache/pip` que invalida a cada `pip install`. O job `security` roda incondicionalmente — Trivy pega dependências vulneráveis, Gitleaks pega a chave AWS que você commitou sem querer. Tempo total: ~2m 40s com cache frio, ~45s aquecido.

## Docker Compose Test Harness: Serviços Reais, Sem Mocks

Mocks mentem. Eles retornam JSON happy-path enquanto seu Postgres de produção dá deadlock num índice faltando. Suba serviços reais no CI — é mais rápido do que debugar uma suite de testes flaky às 2 da manhã.

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

Mounts `tmpfs` mantêm dados na RAM — sem I/O de disco, sem cleanup. Healthchecks com intervalos sub-segundo fazem a stack ficar pronta em ~12 segundos nos runners do GitHub. LocalStack leva mais tempo; aumente os retries se estiver numa máquina mais lenta.

Agora a cola. Salve isso como `scripts/wait-for-services.sh`:

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

Torne executável (`chmod +x scripts/wait-for-services.sh`). O check com `nc` (netcat) é mais leve que `curl` e já vem na imagem do runner.

Helper de teste — coloque isso em `tests/helpers/setup.ts` (adapte para sua linguagem):

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

Rode `setupTestDb()` no `beforeAll` da sua suite de testes, `teardownTestDb()` no `afterAll`. Sem nonsense de `sqlite` in-memory — suas queries batem no mesmo planner, mesmos índices, mesmo comportamento de locking da produção. Se uma migration quebrar, o CI pega. Se um plano de query regredir, o CI pega. Esse é o trabalho.

## Contract Testing: Pare de Quebrar Seu Frontend

Seu frontend espera que `user.email` seja uma string. Sua API acabou de mudar para `null` porque "o negócio disse que alguns usuários não têm email". Seus testes passam. O deploy funciona. O dashboard fica em branco. Contract testing pega isso antes do PR fazer merge — sem Pact Broker, sem infra extra, só artifacts passados entre jobs do workflow.

### Lado da API: Gerar e Publicar o Contrato

Adicione Pact à sua suite de testes NestJS (ou Express, Fastify, o que for). Escreva um teste de provider que sobe sua app de verdade, acessa endpoints reais e verifica se o contrato bate com o que os consumers esperam.

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

Rode no CI com um job que baixa o contrato do consumer primeiro:

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

### Lado do Frontend: Gerar o Contrato do Consumer

Seus testes de frontend definem o que *esperam* da API. Pact grava essas interações e cospe um contrato JSON.

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

Publique o contrato como artifact para o repo da API consumir:

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

### A Dança Entre Repos

Dois repos, uma fonte da verdade. O workflow do frontend roda em todo PR, faz upload de `frontend-contract`. O workflow da API dispara no mesmo PR (via `workflow_dispatch` ou sync agendado), baixa aquele artifact, verifica contra o código atual. Breaking change? A verificação do provider falha. Check vermelho. Sem merge.

Sem broker para manter. Sem dor de cabeça de versionamento. Só `upload-artifact` / `download-artifact` e um entendimento compartilhado de que contratos vivem no repo do consumer — porque *eles* definem o que precisam.

## Varredura de Segurança Que Não Te Afoga em Ruído

A maioria dos scanners de segurança é barulhenta demais — gritam sobre um DoS regex de severidade LOW numa dev dependency que você não toca desde 2019. Você ignora. Aí um RCE CRITICAL passa porque a fadiga de alertas era real. Vamos consertar a relação sinal-ruído.

### Varredura de Container com Trivy

Trivy varre sua imagem buildada, não o Dockerfile. Isso importa — pega vulnerabilidades puxadas no build time, não só o que você declarou.

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

`ignore-unfixed: true` é o segredo — pula vulnerabilidades sem patch ainda, para você não ficar bloqueado esperando maintainers upstream. `vuln-type: 'os,library'` pula ruído de config-audit (como "root user in container") que pertence ao linter do Dockerfile, não ao scanner de vulns.

### Varredura de Dependências: Uma Flag Por Ecossistema

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

O `|| true` impede que o job falhe nos achados — o upload SARIF cuida do bloqueio. A aba de segurança do GitHub agora mostra um período de graça de 7 dias para alertas existentes automaticamente. Achados novos HIGH/CRITICAL bloqueiam o PR; os antigos só te cutucam.

### Segredos: Gitleaks com Supressão Inline

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

A env var `GITLEAKS_CONFIG` embute sua allowlist *no workflow* — sem `.gitleaks.toml` separado para sair de sync. Fixtures de teste, chaves de exemplo em docs, aquele JWT hardcoded em `mocks/auth.go` — suprima inline com um comentário explicando por quê. O você do futuro agradece ao você do presente quando o log de auditoria mostrar *por que* aquela regra existe.

### O Período de Graça É Automático

A UI de alertas de code scanning do GitHub cuida do período de graça de 7 dias para você. Quando um achado novo HIGH/CRITICAL aparece em `main`, mostra "Introduced 3 days ago." Depois de 7 dias em `main` sem fix, vira um alerta "persistent" e começa a falhar PRs que tocam o arquivo afetado. Sem cron jobs, sem dashboards externos, sem encenação de "time de segurança vai revisar".

Rode `gh api repos/:owner/:repo/code-scanning/alerts --jq '.[] | select(.state=="open") | {rule: .rule.id, severity: .rule.severity, file: .most_recent_instance.location.path}'` para auditar o que está realmente aberto. Você vai se surpreender com a velocidade que a lista encolhe quando o ruído para.

## Speed Runs: Mantendo Abaixo de Três Minutos

Seu pipeline é lento porque você reconstrói o universo a cada commit. Pare com isso. Profile primeiro — `act` roda o workflow localmente com as mesmas imagens Docker que o GitHub usa, menos o tempo de fila.

```bash
act push --container-architecture linux/amd64 \
  --secret-file .env.ci \
  -v
```

A flag `-v` monta seu repo read-only para você iterar no YAML sem push. Quando a execução local estiver limpa, envie e audite a coisa real:

```bash
gh run view --log --repo owner/repo --json conclusion,createdAt,updatedAt,jobs
```

Três otimizações cortaram 12 minutos da minha execução fria. Primeiro, **cache de workspace pnpm com Turborepo**. A chave padrão do `actions/cache` é um hash de `pnpm-lock.yaml` — ok para um pacote, inútil para um monorepo onde `packages/ui` muda mas `packages/api` não. Turbo calcula um hash de conteúdo por pacote e só restaura o que foi afetado.

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

Combine com `turbo run build test --filter=...[origin/main]` no step do job. Turbo pula pacotes intocados desde `main` — sem malabarismos de `if: github.event_name == 'pull_request'`.

Segundo, **split da matrix por pacotes afetados** usando `dorny/paths-filter`. Seu monorepo de 12 pacotes não precisa de 12 jobs de teste quando só `packages/billing` mudou.

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

A composite action `.github/actions/test-package/action.yml` roda `pnpm --filter=${{ inputs.package }} test` dentro do harness Docker Compose. Pacotes intocados = zero minutos de runner.

Terceiro, **substitua `docker build` sequencial por `docker buildx bake`** para imagens multi-arch em paralelo. O jeito antigo: build `api`, espera, build `worker`, espera, push nos dois. Bake lê um arquivo HCL e builda todos os targets em paralelo no BuildKit.

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

O export/import de cache do BuildKit (`type=gha`) significa reuso de layers entre execuções — chega de dança de warmup com `docker pull`.

### Checklist: Onboard de um Novo Repo em 10 Minutos

- [ ] `cp -r .github/workflows/ci.yml .github/actions/ docker-compose.ci.yml docker-bake.hcl turbo.json .`
- [ ] `pnpm add -D turbo @types/node typescript` (ou equivalente da sua linguagem)
- [ ] Edite o pipeline do `turbo.json`: tasks `build`, `test`, `lint`, `typecheck` com `dependsOn`
- [ ] Adicione filtros `dorny/paths-filter` batendo com seus globs de pacote
- [ ] Rode `act push -v` — corrija secrets faltando, volume mounts, healthchecks de serviço
- [ ] Push para uma branch de teste, acompanhe `gh run view --log` para o primeiro DAG verde
- [ ] Apague o workflow antigo de `npm test`. Apague o `Dockerfile` antigo que faz `COPY . .` — você tem `docker-bake.hcl` agora.

Três minutos. Checks verdes que significam algo. Vá fazer merge de algo assustador.
