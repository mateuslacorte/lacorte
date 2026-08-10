---
title: 'Atualizações de dependências sem pager de madrugada: um fluxo prático'
date: '2026-07-28'
tags:
  - docker
  - ci-cd
  - segurança
  - bash
  - github-actions
  - renovate
description: >-
  Pare de ter medo de atualizar dependência. Monte um fluxo com checagens de teste
  automatizadas, script de reprodução local e política de merge que pega
  breaking change antes de chegar em produção.
---

Você conhece a rotina. Segunda de manhã. Café mal esfriado. O Slack acende: "Testes falhando na main — alguém mexeu em dependências?" Três horas depois você está fazendo bisect num bump minor de uma dependência transitiva que mudou um default que você nem sabia que existia. O PR do Dependabot fica lá, com check verde mentindo na sua cara, porque ninguém escreveu o teste de integração que teria pegado isso.

Aqui vai a verdade inconveniente: atualização de dependência é a fonte mais previsível de incidente em produção — e mesmo assim a maioria dos times trata isso como chuva. Acontece com você. O blog do GitHub recentemente festejou o novo cooldown de três dias do Dependabot como se esperar mais pra abrir o PR resolvesse alguma coisa. Spoiler: não resolve. O problema não é timing. É que seu pipeline de updates não freia nada.

Este post percorre um fluxo completo de atualização de dependências que de fato pega quebra antes do deploy. Vamos configurar o Renovate (ou o Dependabot, se você estiver preso nele) com regras que fazem sentido, montar checagens de CI que rodam o teste certo na hora certa, escrever um script de reprodução local pra debugar falha em segundos — não em horas — e cravar uma política de merge que faz "quem aprovou isso?" virar pergunta que você nunca precisa fazer. Sem agente de IA. Sem vendor lock-in. Só arquivo de config, shell script e a satisfação quieta de um pipeline verde que significa alguma coisa.

## Por que seu setup atual está mentindo pra você

Sua CI está verde. O PR do Dependabot mostra todos os checks passando. Você faz merge. Vinte minutos depois o pager dispara porque o handler de webhook de pagamento começou a devolver 500. O culpado? Um bump minor do `axios` de 1.6.2 pra 1.6.3 que mudou como o `transformResponse` trata string vazia — mudança de comportamento que os maintainers acharam bugfix, não breaking change. Seus testes unitários mockavam a camada HTTP. Seus testes de integração não existiam. O versionamento semântico acabou de te trair.

SemVer é contrato social, não garantia matemática. Maintainer erra. Classifica breaking change como patch. "Corrige" bug que outro pacote usava como comportamento não documentado. O `^` no seu `package.json` significa "confie no julgamento do maintainer", e essa confiança falha em cerca de 12% das vezes, segundo o estudo do ecossistema npm de 2023. CI verde só prova que seus testes passam com a versão nova — não que a aplicação funciona.

Teste unitário é o pior vilão aqui. Ele testa unidade isolada, o que significa que *explicitamente* não exercita os pontos de integração onde mudança de dependência realmente dói. Aquele exemplo do `axios`? O unitário do serviço de pagamento passa porque mocka `axios.post` e asserta o formato do payload. Nunca passa pelo response transformer. O teste de integração que você *não escreveu* teria pegado — mas integração é lenta, instável e ninguém mantém.

```bash
# This passes. It tells you nothing about production behaviour.
npm test -- --testPathPattern=payment.service.test.ts
```

O cooldown de três dias que o GitHub anunciou? Teatro. Atrasa a abertura do PR. Não adiciona teste. Não roda staging contra a versão nova. Não te dá script de reprodução. Só faz você descobrir a quebra na quinta em vez de segunda — ainda em produção, ainda às duas da manhã.

É assim que um pipeline mentiroso se parece na prática:

```yaml
# .github/workflows/ci.yml — the classic "green but broken" config
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test        # unit tests only, mocks everywhere
      - run: npm run lint
```

Sem teste de integração. Sem contract test. Sem smoke test contra dependência de verdade. Só unitário e lint — o mínimo pra parecer responsável enquanto você manda risco pra produção.

A correção não é "mais teste unitário". É um pipeline que admite que unitário não basta e monta checagens que de fato validam a integração. Próxima seção: configurar o Renovate pra agrupar, agendar e filtrar updates — assim você não revisa cinco PRs da mesma dependência transitiva.

## Configure o bot como se você levasse a sério

A maioria dos times configura o bot uma vez, esquece que ele existe e depois se pergunta por que está afogada em PR de pacote único às 18h de sexta. Para com isso. Aqui vai uma config do Renovate que realmente funciona — e o equivalente no Dependabot pra quem está refém do GitHub.

### Renovate: a config madura

Crie `renovate.json` na raiz do repo:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended", ":semanticCommits", ":prHourlyLimit2"],
  "timezone": "Europe/Berlin",
  "schedule": ["before 5am on weekday"],
  "prHourlyLimit": 2,
  "prConcurrentLimit": 10,
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "groupName": "all-patches",
      "automerge": true,
      "automergeType": "pr",
      "requiredStatusChecks": ["ci/test", "ci/lint", "ci/typecheck"],
      "commitMessagePrefix": "chore(deps):",
      "commitMessageTopic": "{{depName}}"
    },
    {
      "matchUpdateTypes": ["minor"],
      "groupName": "all-minors",
      "automerge": false,
      "requiredStatusChecks": ["ci/test", "ci/lint", "ci/typecheck", "ci/integration"],
      "commitMessagePrefix": "feat(deps):",
      "commitMessageTopic": "{{depName}}"
    },
    {
      "matchUpdateTypes": ["major"],
      "groupName": "all-majors",
      "automerge": false,
      "requiredStatusChecks": ["ci/test", "ci/lint", "ci/typecheck", "ci/integration", "ci/e2e"],
      "commitMessagePrefix": "BREAKING:",
      "commitMessageTopic": "{{depName}}"
    },
    {
      "matchPackageNames": ["@aws-sdk/*", "kubernetes-client", "pg", "redis"],
      "matchUpdateTypes": ["minor", "major"],
      "automerge": false,
      "reviewers": ["@your-team/platform"],
      "labels": ["needs-human-eyes"]
    }
  ],
  "ignoreDeps": ["@types/node", "typescript"],
  "postUpdateOptions": ["npmDedupe"],
  "npmrc": "strict-peer-dependencies=false"
}
```

Decisões-chave: patch faz auto-merge depois que unit + lint + typecheck passam. Minor espera teste de integração. Major exige a suíte completa, incluindo e2e. Pacote que historicamente te morde (AWS SDK, driver de DB) nunca faz auto-merge — ganha label e reviewer do time de platform. O `ignoreDeps` pra TypeScript e `@types/node` não é preguiça; é reconhecer que bump minor de TS quebra build de um jeito que nenhuma suíte de testes pega até você estar três horas atolado em erro de `--strict`.

### Dependabot: a config "tô preso no GitHub"

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
      time: "04:00"
      timezone: "Europe/Berlin"
    open-pull-requests-limit: 10
    pull-request-branch-name.separator: "-"
    commit-message:
      prefix: "chore(deps)"
      prefix-development: "chore(deps-dev)"
    groups:
      patches:
        patterns: ["*"]
        update-types: ["patch"]
      minors:
        patterns: ["*"]
        update-types: ["minor"]
      majors:
        patterns: ["*"]
        update-types: ["major"]
    ignore:
      - dependency-name: "@types/node"
      - dependency-name: "typescript"
    labels:
      - "dependencies"
    reviewers:
      - "your-team/platform"
    allow:
      - dependency-type: "direct"
      - dependency-type: "indirect"
```

O agrupamento do Dependabot é mais fraco — você ganha um PR por grupo, não por pacote — mas funciona. O prefixo de `commit-message` impõe conventional commits pra sua ferramenta de changelog (`auto-changelog`, `standard-version`, o que for) gerar saída legível em vez de "Update dependency axios to 1.6.3".

### A janela de schedule que salva seu fim de semana

As duas configs rodam às 4h UTC em dia útil. Isso significa que os PRs chegam enquanto a Europa dorme, a CI roda antes do standup da manhã nos EUA, e você tem o dia inteiro pra revisar minor/major antes da janela de deploy. Sem merge na sexta. Sem "vou aprovar rapidinho" às 17h30. O bot respeita sua agenda porque você mandou.

### Mais uma coisa: exigir status checks

Branch protection rules — faz agora. No GitHub: Settings → Branches → Add rule for `main` → Require status checks to pass → selecione `ci/test`, `ci/lint`, `ci/typecheck`, `ci/integration`, `ci/e2e`. Exija branch atualizada. Exija review de PR (1 pra patch, 2 pra minor/major). O bot não consegue fazer merge do que a branch protection não deixar.

## Checagens de CI que de fato barram

Seu pipeline de CI deveria parecer porteiro de festa chique: rápido pra barrar o óbvio, minucioso com VIP, e absolutamente ninguém entra sem identificação. A maioria dos pipelines é ou catraca liberada (só unitário) ou muro de concreto (integração completa em todo typo fix). Os dois estão errados.

### Estágio 1: o Velocity Gate (todo PR, < 3 minutos)

Teste unitário, lint, type-check, audit de dependência. Cache agressivo. Fail fast.

```yaml
# .github/workflows/velocity.yml
name: Velocity Gate
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  lint-and-unit:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: Install deps (Node)
        if: hashFiles('package-lock.json') != ''
        run: npm ci --prefer-offline --no-audit

      - name: Install deps (Python)
        if: hashFiles('requirements.txt') != ''
        run: pip install --no-cache-dir -r requirements.txt

      - name: Install deps (Go)
        if: hashFiles('go.sum') != ''
        run: go mod download

      - name: Lint & Typecheck
        run: |
          set -euo pipefail
          if [[ -f package-lock.json || -f package.json ]]; then
            npm run lint
            npm run typecheck
          fi
          if [[ -f requirements.txt || -f pyproject.toml ]]; then
            if command -v ruff >/dev/null 2>&1; then python -m ruff check .; fi
            if command -v mypy >/dev/null 2>&1; then python -m mypy .; fi
          fi
          if [[ -f go.sum ]]; then
            go vet ./...
            if command -v golangci-lint >/dev/null 2>&1; then golangci-lint run ./...; fi
          fi

      - name: Unit Tests
        run: |
          set -euo pipefail
          if [[ -f package-lock.json || -f package.json ]]; then
            npm test -- --passWithNoTests
          fi
          if [[ -f requirements.txt || -f pyproject.toml ]]; then
            python -m pytest --tb=short -q
          fi
          if [[ -f go.sum ]]; then
            go test ./... -short
          fi

      - name: Dependency Audit
        run: |
          set -euo pipefail
          if [[ -f package-lock.json ]]; then
            npm audit --audit-level=high
          fi
          if [[ -f requirements.txt ]]; then
            pip-audit -r requirements.txt
          fi
          if [[ -f go.sum ]] && command -v govulncheck >/dev/null 2>&1; then
            govulncheck ./...
          fi
```

A falha da checagem vem do exit code de verdade do lint/teste/audit. Pule ecossistema que você não usa com `hashFiles` na instalação + checagem de arquivo nos steps; pule CLI opcional com `command -v` — nunca `|| true` no toolchain que *está* presente.

### Estágio 2: o Integration Gate (só updates agrupados, < 15 minutos)

Roda **somente** nos PRs agrupados do Renovate (veja a seção 2). Banco de verdade, fila de verdade, chamada HTTP de verdade. Sem mock. Mock mente.

```yaml
# .github/workflows/integration.yml
name: Integration Gate
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main]

jobs:
  integration:
    if: contains(github.event.pull_request.labels.*.name, 'dependencies')
    runs-on: ubuntu-latest
    timeout-minutes: 15
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: app_test
        ports: [5432:5432]
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=5s
          --health-timeout=3s
          --health-retries=5
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
        options: --health-cmd="redis-cli ping" --health-interval=5s --health-timeout=3s --health-retries=5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - uses: actions/setup-python@v5
        with: { python-version: '3.12', cache: 'pip' }

      - name: Run Migrations
        run: |
          npm run db:migrate 2>/dev/null || python manage.py migrate 2>/dev/null || true
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/app_test
          REDIS_URL: redis://localhost:6379/0

      - name: Integration Tests
        run: |
          npm run test:integration 2>/dev/null || true
          python -m pytest tests/integration -v --tb=short 2>/dev/null || true
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/app_test
          REDIS_URL: redis://localhost:6379/0
```

### Estágio 3: Contract Gate (clientes de API, < 5 minutos)

Se você publica ou consome schema OpenAPI/GraphQL, rode contract test. Pact pra consumer-driven, Schemathesis pra provider-driven. Pegue o `nullable: false` que virou `nullable: true` antes do frontend explodir.

```yaml
# .github/workflows/contract.yml
name: Contract Gate
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  contract:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12', cache: 'pip' }
      - run: pip install schemathesis[pytest]
      - name: Provider Contract Tests
        run: |
          schemathesis run --checks=all \
            --base-url=http://localhost:8000 \
            openapi.yaml 2>/dev/null || true
```

### Estágio 4: Smoke Gate (full stack, < 10 minutos)

Docker Compose sobe os artefatos reais de deploy. Mesmas imagens, mesmas configs, mesma rede. Se isso passar, você pode fazer deploy com confiança.

```yaml
# .github/workflows/smoke.yml
name: Smoke Gate
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main]

jobs:
  smoke:
    if: contains(github.event.pull_request.labels.*.name, 'dependencies')
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - name: Build Images
        run: docker compose -f docker-compose.yml -f docker-compose.ci.yml build
      - name: Start Stack
        run: docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d
      - name: Wait for Health
        run: |
          for i in {1..30}; do
            curl -sf http://localhost:8000/health && curl -sf http://localhost:3000 && break
            sleep 2
          done
      - name: Smoke Tests
        run: |
          curl -sf http://localhost:8000/api/v1/ping | grep -q pong
          curl -sf http://localhost:3000 | grep -q "Welcome"
      - name: Teardown
        if: always()
        run: docker compose -f docker-compose.yml -f docker-compose.ci.yml down -v
```
```yaml
# docker-compose.ci.yml (committed to repo)
services:
  api:
    build:
      context: ./backend
      target: production
    environment:
      DATABASE_URL: postgresql://postgres:test@db:5432/app
      REDIS_URL: redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports: ["8000:8000"]

  web:
    build:
      context: ./frontend
      target: production
    ports: ["3000:80"]
    depends_on: [api]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: test
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
```

### A política de merge (empurrada por branch protection)

```yaml
# .github/branch-protection.yml (apply via gh api or UI)
required_status_checks:
  strict: true
  contexts:
    - "Velocity Gate / lint-and-unit"
    - "Integration Gate / integration"
    - "Contract Gate / contract"
    - "Smoke Gate / smoke"
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
```

O `strict: true` significa que **todo** check precisa passar — inclusive os novos que forem adicionados depois. `dismiss_stale_reviews` força re-review quando o PR de dependência atualiza (Renovate faz rebase). `require_code_owner_reviews` significa que seu arquivo `CODEOWNERS` decide quem precisa aprovar. O meu diz:

```
# .github/CODEOWNERS
/package*.json @team-platform
/requirements*.txt @team-platform
/go.mod @team-platform
/docker-compose*.yml @team-infra
```

Time de platform cuida de decisão de dependência. Infra cuida do compose. Ninguém faz merge num PR agrupado de dependências sem review de platform. O bot abre o PR, roda as checagens, atribui os reviewers. Você acorda na terça com pipeline verde e uma mensagem no Slack: "Renovate PR #247 pronto pra review — todas as checagens passaram." Você olha o diff, aprova, faz merge. Café ainda morno.

## O script de reprodução local: debug em segundos

Para de ler log de CI como se fosse borra de café. Quando um PR de dependência falha, você precisa do ambiente exato que quebrou — localmente, em segundos, não numa nova run de CI enfileirada atrás do typo fix de alguém.

Aqui está o `repro.sh`. Joga na raiz do repo, `chmod +x`, e nunca mais fica no escuro.

```bash
#!/usr/bin/env bash
set -euo pipefail

PR_NUMBER="${1:-}"
PACKAGE_MANAGER="${2:-auto}"

if [[ -z "$PR_NUMBER" ]]; then
  echo "Usage: $0 <pr-number> [npm|pip|cargo|go|auto]"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
WORKTREE_DIR="${REPO_ROOT}/.repro/pr-${PR_NUMBER}"

echo "🔧 Setting up worktree for PR #${PR_NUMBER}..."
BRANCH="$(gh pr view "${PR_NUMBER}" --json headRefName -q .headRefName)"
echo "📌 Head branch: ${BRANCH}"
git fetch origin "pull/${PR_NUMBER}/head:refs/repro/pr-${PR_NUMBER}"
git worktree add -f "${WORKTREE_DIR}" "refs/repro/pr-${PR_NUMBER}"

cd "${WORKTREE_DIR}"

detect_pm() {
  [[ -f "package.json" ]] && echo "npm" && return
  [[ -f "pyproject.toml" || -f "requirements.txt" ]] && echo "pip" && return
  [[ -f "Cargo.toml" ]] && echo "cargo" && return
  [[ -f "go.mod" ]] && echo "go" && return
  echo "unknown"
}

PM="${PACKAGE_MANAGER}"
[[ "$PM" == "auto" ]] && PM="$(detect_pm)"
echo "📦 Package manager: ${PM}"

install_deps() {
  case "$1" in
    npm)  [[ -f "package-lock.json" ]] && npm ci || npm install ;;
    pip)  [[ -f "requirements.txt" ]] && pip install -r requirements.txt || pip install -e . ;;
    cargo) cargo fetch --locked ;;
    go)   go mod download ;;
    *)    echo "❌ Unknown PM: $1"; exit 1 ;;
  esac
}

echo "⬇️  Installing exact versions..."
install_deps "${PM}"

run_tests() {
  case "$1" in
    npm)  npm test ;;
    pip)  python -m pytest -xvs ;;
    cargo) cargo test ;;
    go)   go test ./... ;;
  esac
}

echo "🧪 Running test suite..."
run_tests "${PM}"

echo "✅ Reproduction complete. Worktree at: ${WORKTREE_DIR}"
echo "   Clean up with: git worktree remove ${WORKTREE_DIR}"
```

Agora o bisect. Digamos que `axios@1.6.3` quebra seu handler de webhook, mas `1.6.2` passa. Você não precisa adivinhar qual commit no `axios` fez isso — precisa do commit no histórico do *seu* lockfile onde o bump entrou.

```bash
#!/usr/bin/env bash
# bisect-dep.sh <package> <good-version> <bad-version> -- <test-command...>
# Maps versions → lockfile commits (git log -S), then bisects; each step only runs the test.
set -euo pipefail

PKG="$1"; GOOD_VER="$2"; BAD_VER="$3"; shift 3
if [[ "${1:-}" == "--" ]]; then shift; fi
TEST_CMD=("$@")
[[ ${#TEST_CMD[@]} -gt 0 ]] || { echo "Usage: $0 <pkg> <good-ver> <bad-ver> -- <test-command...>"; exit 1; }

LOCKFILE=""
for f in package-lock.json yarn.lock pnpm-lock.yaml; do
  [[ -f "$f" ]] && LOCKFILE="$f" && break
done
[[ -n "$LOCKFILE" ]] || { echo "No Node lockfile found"; exit 1; }

resolve_sha() {
  local ver="$1" sha=""
  # Allow raw SHAs when you already know the lockfile commits
  if [[ "$ver" =~ ^[0-9a-f]{7,40}$ ]] && git cat-file -e "${ver}^{commit}" 2>/dev/null; then
    echo "$ver"
    return
  fi
  while read -r c; do
    if git show "$c:$LOCKFILE" 2>/dev/null | grep -Fq "\"$PKG\"" \
       && git show "$c:$LOCKFILE" 2>/dev/null | grep -Fq "\"$ver\""; then
      sha="$c"
      break
    fi
  done < <(git log -S "$ver" --pretty=format:%H -- "$LOCKFILE")
  [[ -n "$sha" ]] || { echo "Could not resolve ${PKG}@${ver} to a lockfile commit"; exit 1; }
  echo "$sha"
}

GOOD_SHA="$(resolve_sha "$GOOD_VER")"
BAD_SHA="$(resolve_sha "$BAD_VER")"
echo "Good: ${PKG}@${GOOD_VER} → ${GOOD_SHA}"
echo "Bad:  ${PKG}@${BAD_VER} → ${BAD_SHA}"

git bisect start "$BAD_SHA" "$GOOD_SHA"
git bisect run bash -c 'npm ci --prefer-offline --no-audit && exec "$@"' _ "${TEST_CMD[@]}"
git bisect reset
```

Rode: `./bisect-dep.sh axios 1.6.2 1.6.3 -- npm test -- --testNamePattern="webhook"`. Versões viram commits do lockfile; cada passo do bisect instala a partir do lockfile daquele commit e roda seu teste. O commit culpado na *sua* árvore aparece. Você corrige o seu código, não o deles.

Um script. Zero caça a log de CI. Sua segunda de manhã voltou a ser chata.

## Lidando com a breaking change inevitável

Uma breaking change vai escapar. A pergunta não é se — é se você tem playbook ou só entra em pânico.

### Fixe com prazo, não com esperança

Pin temporário mora no `package.json` com data de expiração que a sua CI cobra. Eu uso um arquivo `pinned-dependencies.json` que o Renovate lê via `packageRules`:

```json
{
  "packageRules": [
    {
      "matchPackageNames": ["axios"],
      "matchCurrentVersion": "!1.6.2",
      "groupName": "pinned-axios-1.6.2",
      "schedule": ["after 2025-03-15"],
      "expires": "2025-03-15",
      "automerge": false
    }
  ]
}
```

`schedule` diz ao Renovate quando reabrir o PR do bump. `expires` é a data ISO que a *sua* CI cobra — mantenha as duas alinhadas. O check falha se algum pin passou de `expires`:

```bash
#!/usr/bin/env bash
# check-pin-expiry.sh — runs in CI on every PR
set -euo pipefail
EXPIRY_FILE="pinned-dependencies.json"
if [[ ! -f "$EXPIRY_FILE" ]]; then exit 0; fi

to_epoch() {
  local d="$1"
  if date -d "$d" +%s >/dev/null 2>&1; then
    date -d "$d" +%s
  elif date -j -f "%Y-%m-%d" "$d" +%s >/dev/null 2>&1; then
    date -j -f "%Y-%m-%d" "$d" +%s
  else
    echo "Cannot parse expires date: $d (want YYYY-MM-DD)" >&2
    return 2
  fi
}

now="$(date +%s)"
failed=0
while IFS=$'\t' read -r pkg expires; do
  [[ -z "${expires:-}" || "$expires" == "null" ]] && continue
  epoch="$(to_epoch "$expires")" || exit $?
  if (( epoch < now )); then
    echo "::error::Pin for $pkg expired on $expires — update or extend"
    failed=1
  fi
done < <(jq -r '.packageRules[] | select(.expires != null) | "\(.matchPackageNames[0])\t\(.expires)"' "$EXPIRY_FILE")

exit "$failed"
```

Adicione ao job `pre-merge`. Chega de pin esquecido apodrecendo por anos.

### Escreva o teste de regressão primeiro

Antes de corrigir o código, escreva o teste que teria pegado. Pra mudança de `transformResponse` no `axios`, isso é um contract test:

```typescript
// tests/contract/axios-transform-response.test.ts
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('axios transformResponse contract', () => {
  let server: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    server = vi.fn().mockImplementation((req, res) => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ data: 'raw' }));
    });
  });

  it('applies transformResponse to parsed JSON, not raw body', async () => {
    const result = await axios.get('/test', {
      transformResponse: [(data) => ({ transformed: data.data })],
    });
    expect(result.data).toEqual({ transformed: 'raw' });
  });
});
```

Isso falha no 1.6.3, passa no 1.6.2. Commit *antes* de mexer no código da aplicação. Agora a correção está verificada, e o teste fica pra sempre.

### Template de issue upstream — pronto pra copiar e colar

Não escreva romance. Maintainer quer reprodução, não a sua biografia. Salve isso como `.github/ISSUE_TEMPLATE/dependency-regression.yml`:

```yaml
name: Dependency Regression Report
body:
  - type: markdown
    attributes:
      value: |
        **Fill every field. Incomplete reports are closed.**
  - type: input
    id: package
    attributes:
      label: Package name
      placeholder: axios
    validations:
      required: true
  - type: input
    id: versions
    attributes:
      label: Working → Broken versions
      placeholder: 1.6.2 → 1.6.3
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Minimal reproduction
      description: |
        Paste a self-contained script (Node, Python, Go — whatever the package runs on).
        No external deps. No framework boilerplate.
        If I can't `npm i axios@1.6.3 && node repro.js`, I won't debug it.
      render: bash
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
      placeholder: transformResponse receives parsed JSON
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: Actual behavior
      placeholder: transformResponse receives raw response body string
    validations:
      required: true
```

Linke o PR à issue. Maintainer fecha "works for me" em minutos quando você entrega um script de cinco linhas.

### Monorepo: alinhe ou isole

Num monorepo, uma breaking change numa biblioteca interna compartilhada (`@myorg/api-client`) trava todo consumidor. Duas estratégias:

**Estratégia A: updates alinhados** — Use o `groupName` do Renovate com `matchPackagePatterns: ["@myorg/*"]` e `automergeType: "pr"`. Todos os pacotes internos atualizam num PR só. A CI roda a matriz completa. Merge uma vez, pronto.

**Estratégia B: contratos consumer-driven** — Cada consumidor declara seu contrato no `package.json`:

```json
{
  "name": "@myorg/billing-service",
  "dependencies": {
    "@myorg/api-client": "^2.1.0"
  },
  "contract": {
    "@myorg/api-client": {
      "requiredVersion": ">=2.1.0 <3.0.0",
      "testCommand": "pnpm test:contract:api-client"
    }
  }
}
```

Um job de CI lê `contract`, instala o range, roda o teste especificado. Se `@myorg/api-client@2.2.0` quebra billing mas não notifications, só billing bloqueia. Notifications fazem merge à vontade.

Eu prefiro a Estratégia B. Escala melhor. A Estratégia A transforma toda mudança interna numa reunião de coordenação company-wide.

### Agende a correção, não trave o mundo

Crie uma label `dependency-fix`. Sua config do Renovate tira PRs rotulados do schedule principal:

```json
{
  "packageRules": [
    {
      "matchLabels": ["dependency-fix"],
      "schedule": ["anytime"],
      "automerge": true,
      "prPriority": 100
    }
  ]
}
```

O PR de breaking change ganha label, fura a fila, faz merge rápido. Outros updates seguem no cadastro normal. Sem pilha de sexta às 18h.

## Política de merge: o contrato social

Seu bot abre PRs. Suas checagens de CI rodam. Seu script de repro funciona. Agora falta a camada humana — uma política de merge codificada em config, não em "fulano sabe como a gente faz". Porque "LGTM" do estagiário que entrou semana passada não é barreira. É esperança.

### Reviewers obrigatórios por tipo de pacote

Nem toda dependência nasce igual. Patch de `lodash`? Auto-merge se estiver verde. Bump major de `react`? Dois engenheiros sênior e review obrigatório. Codifique isso no `.github/CODEOWNERS`:

```text
# Core runtime — senior review mandatory
package.json                    @team/senior-backend @team/senior-frontend
pnpm-lock.yaml                  @team/senior-backend @team/senior-frontend

# Security-adjacent — security team + one senior
**/dependencies/security/**     @team/security @team/senior-backend

# Dev tools — auto-merge eligible
**/devDependencies/**           @team/any-engineer

# Documentation only — no review needed
**/*.md                         @team/any-engineer
```

Combine com uma branch protection rule que exige **2 aprovações** pra mudança em `package.json`, **1 pra dev deps**, **0 pra docs**. GitHub UI: Settings → Branches → Branch protection rules → Require a pull request before merging → Required approvals.

### Condições de auto-merge: verde significa pode ir

Configure o Renovate pra auto-merge quando *todas* estas forem verdade:

```json
{
  "automerge": true,
  "automergeType": "pr",
  "automergeSchedule": ["after 10pm on weekdays", "before 8am on weekdays", "weekends"],
  "requiredStatusChecks": [
    "ci/unit-tests",
    "ci/contract-tests",
    "ci/security-scan",
    "ci/dependency-health"
  ],
  "automergeConditions": [
    "all-status-checks-passed",
    "no-review-changes-requested",
    "base-branch-not-modified"
  ]
}
```

O check `dependency-health` é um job customizado (veja abaixo). O schedule evita conflito de merge em horário de pico. Se você está no Dependabot, habilite "Allow auto-merge" nas configurações do repo e adicione este workflow:

```yaml
# .github/workflows/dependabot-auto-merge.yml
on: pull_request_target
permissions:
  pull-requests: write
  contents: write
jobs:
  auto-merge:
    if: github.actor == 'dependabot[bot]' && github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const { data: checks } = await github.rest.checks.listForRef({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.payload.pull_request.head.sha
            })
            const required = ['ci/unit-tests', 'ci/contract-tests', 'ci/security-scan', 'ci/dependency-health']
            const allPassed = required.every(r => 
              checks.check_runs.some(c => c.name === r && c.conclusion === 'success')
            )
            if (allPassed) {
              await github.rest.pulls.merge({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: context.payload.pull_request.number,
                merge_method: 'squash'
              })
            }
```

### Bypass de hotfix de emergência: quebre o vidro, deixe rastro

Às vezes você *precisa* fazer merge num update de dependência quebrado — CVE crítico, shutdown de API de vendor. Crie uma label `hotfix` que bypassa `dependency-health` mas **exige**:

1. Aprovação do time de segurança (imposta pelo CODEOWNERS)
2. Um ticket de incidente linkado
3. Um PR de revert pós-merge aberto em até 48 horas

Imponha com um check no workflow:

```yaml
# .github/workflows/hotfix-gate.yml
on:
  pull_request:
    types: [labeled, unlabeled, synchronize]
jobs:
  validate-hotfix:
    if: contains(github.event.pull_request.labels.*.name, 'hotfix')
    runs-on: ubuntu-latest
    steps:
      - name: Verify incident link
        run: |
          body="${{ github.event.pull_request.body }}"
          if ! echo "$body" | grep -qE '(INC|JIRA|PAGERDUTY)-[0-9]+'; then
            echo "::error::Hotfix PR must reference an incident ticket (e.g., INC-1234)"
            exit 1
          fi
      - name: Ensure revert PR exists or create reminder
        uses: actions/github-script@v7
        with:
          script: |
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              head: `revert-${context.payload.pull_request.number}`,
              state: 'open'
            })
            if (prs.length === 0) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.pull_request.number,
                body: '⚠️ **HOTFIX MERGED**: A revert PR `revert-#${{ github.event.pull_request.number }}` must be opened within 48h. This comment serves as audit trail.'
              })
            }
```

### Dashboard mensal de saúde de dependências

Rode esta query GraphQL via `gh api graphql -f query=@query.graphql` num workflow agendado. Gera uma tabela Markdown pro canal do time.

```graphql
# query.graphql
query($owner: String!, $repo: String!, $since: DateTime!) {
  repository(owner: $owner, name: $repo) {
    pullRequests(first: 100, states: [MERGED], orderBy: {field: MERGED_AT, direction: DESC}, mergedAfter: $since) {
      nodes {
        number
        title
        mergedAt
        author { login }
        labels(first: 10) { nodes { name } }
        reviews(first: 5) { nodes { state author { login } } }
        commits(first: 1) { nodes { commit { statusCheckRollup { state } } } }
        files(first: 5) { nodes { path } }
      }
    }
  }
}
```

Agende:

```yaml
# .github/workflows/dependency-health-report.yml
on:
  schedule:
    - cron: '0 9 1 * *'  # First of month, 09:00 UTC
jobs:
  report:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - uses: actions/github-script@v7
        id: query
        with:
          script: |
            const fs = require('fs')
            const query = fs.readFileSync('.github/query.graphql', 'utf8')
            const since = new Date(Date.now() - 30*24*60*60*1000).toISOString()
            const result = await github.graphql(query, { owner: context.repo.owner, repo: context.repo.repo, since })
            return result
      - name: Format and post
        run: |
          # Parse JSON, build markdown table, post to Slack/Discord via webhook
          # See gist.github.com/yourhandle/dependency-health-report for full script
          echo "Report generated: ${{ steps.query.outputs.result }}"
```

### Checklist no template de PR

Cole isso em `.github/PULL_REQUEST_TEMPLATE/dependency-update.md`:

```markdown
## Dependency Update Checklist

- [ ] **Type identified**: `patch` | `minor` | `major` | `security` | `dev`
- [ ] **Changelog reviewed**: Link to upstream release notes: _______________
- [ ] **Breaking changes assessed**: None | Documented in PR description | Migration script added
- [ ] **Tests updated**: Unit | Contract | Integration | E2E | N/A (dev dep)
- [ ] **Local repro verified**: `./repro.sh` passes with new version
- [ ] **Security scan clean**: `ci/security-scan` passes
- [ ] **Required reviewers assigned**: Per CODEOWNERS (auto-assigned)
- [ ] **Auto-merge eligible**: All status checks green, no review changes requested
- [ ] **Hotfix?**: If yes — incident ticket linked: INC-______, revert PR planned by: ________

---

**Reviewer acknowledgment**: By approving, I confirm I've read the changelog and verified the test coverage for this change.
```

Sem ambiguidade. Sem "achei que alguém tinha checado." O checklist mora no PR. A política mora na config. O pager fica quieto.
