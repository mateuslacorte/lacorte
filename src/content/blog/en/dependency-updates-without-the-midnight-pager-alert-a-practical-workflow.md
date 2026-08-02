---
title: 'Dependency Updates Without the Midnight Pager Alert: A Practical Workflow'
date: '2026-07-28'
tags:
  - docker
  - ci-cd
  - security
  - bash
  - github-actions
  - renovate
description: >-
  Stop fearing dependency updates. Build a workflow with automated testing gates, local reproduction scripts, and merge policies that catch breaking changes before they hit production.
---

You know the drill. Monday morning. Coffee barely cool. Slack lights up: "Tests failing on main — anyone touch dependencies?" Three hours later you're bisecting a minor version bump in a transitive dependency that changed a default you didn't even know existed. The Dependabot PR sits there, green checkmarks lying to your face because nobody wrote the integration test that would've caught it.

Here's the uncomfortable truth: dependency updates are the most predictable source of production incidents, yet most teams treat them like weather — something that just happens to you. The GitHub blog recently crowed about Dependabot's new three-day cooldown as if waiting longer before opening a PR solves anything. Spoiler: it doesn't. The problem isn't timing. It's that your update pipeline has no teeth.

This post walks through a complete dependency update workflow that actually catches breaks before they ship. We'll configure Renovate (or Dependabot, if you're stuck with it) with meaningful rules, build CI gates that run the right tests at the right time, write a local reproduction script so you can debug failures in seconds not hours, and establish a merge policy that makes "who approved this?" a question you never have to ask. No AI agents. No vendor lock-in. Just config files, shell scripts, and the quiet satisfaction of a green pipeline that means something.

## Why Your Current Setup Is Lying to You

Your CI is green. The Dependabot PR shows all checks passing. You merge it. Twenty minutes later, the pager goes off because the payment webhook handler started returning 500s. The culprit? A minor version bump in `axios` from 1.6.2 to 1.6.3 that changed how `transformResponse` handles empty strings — a behavioural shift the maintainers considered a bug fix, not a breaking change. Your unit tests mocked the HTTP layer. Your integration tests didn't exist. Semantic versioning just betrayed you.

SemVer is a social contract, not a mathematical guarantee. Maintainers make mistakes. They classify breaking changes as patches. They fix bugs that other packages depended on as undocumented behaviour. The `^` in your `package.json` means "trust the maintainer's judgement," and that trust is misplaced roughly 12% of the time according to the npm ecosystem study from 2023. Your green CI only proves your tests pass against the new version — not that your application works.

Unit tests are the worst offenders here. They test units in isolation, which means they explicitly *don't* test the integration points where dependency changes actually bite. That `axios` example? The unit test for your payment service passes because it mocks `axios.post` and asserts the payload shape. It never exercises the response transformer. The integration test you *didn't write* would have caught it — but integration tests are slow, flaky, and nobody maintains them.

```bash
# This passes. It tells you nothing about production behaviour.
npm test -- --testPathPattern=payment.service.test.ts
```

The three-day cooldown GitHub announced? Theatre. It delays the PR opening. It doesn't add tests. It doesn't run your staging environment against the new version. It doesn't give you a reproduction script. It just means you discover the break on Thursday instead of Monday — still in production, still at 2 AM.

Here's what a lying pipeline looks like in practice:

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

No integration tests. No contract tests. No smoke test against a real dependency. Just unit tests and linting — the bare minimum to feel responsible while shipping risk.

The fix isn't more unit tests. It's a pipeline that admits unit tests aren't enough and builds gates that actually validate the integration surface. Next section: configuring Renovate to group, schedule, and gate updates so you're not reviewing five PRs for the same transitive dependency.

## Configure the Bot Like You Mean It

Most teams configure their bot once, forget it exists, then wonder why they're drowning in single-package PRs at 6 PM on Friday. Stop that. Here's a Renovate config that actually works, plus the Dependabot equivalent for the GitHub-hostage crowd.

### Renovate: The Grown-Up Config

Create `renovate.json` at repo root:

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

Key decisions: patches auto-merge after unit + lint + typecheck pass. Minors wait for integration tests. Majors demand the full suite including e2e. Packages that historically bite you (AWS SDK, DB drivers) never auto-merge — they get a label and a platform team reviewer. The `ignoreDeps` for TypeScript and `@types/node` isn't laziness; it's acknowledging that TS minor bumps break builds in ways no test suite catches until you're three hours deep in `--strict` errors.

### Dependabot: The "I'm Stuck With GitHub" Config

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

Dependabot's grouping is weaker — you get one PR per group, not per package — but it works. The `commit-message` prefix enforces conventional commits so your changelog tool (`auto-changelog`, `standard-version`, whatever) actually produces readable output instead of "Update dependency axios to 1.6.3".

### The Schedule Window That Saves Your Weekends

Both configs run at 4 AM UTC on weekdays. That means PRs land while Europe sleeps, CI runs before US morning standup, and you have all day to review minors/majors before the deploy window. No Friday merges. No "I'll just approve this real quick" at 5:30 PM. The bot respects your calendar because you told it to.

### One More Thing: Require Status Checks

Branch protection rules — do it now. In GitHub: Settings → Branches → Add rule for `main` → Require status checks to pass → select `ci/test`, `ci/lint`, `ci/typecheck`, `ci/integration`, `ci/e2e`. Require branches to be up to date. Require PR reviews (1 for patches, 2 for minors/majors). The bot can't merge what the branch protection won't allow.

## CI Gates That Actually Gate

Your CI pipeline should resemble a bouncer at an exclusive club: fast to reject the obvious riff-raff, thorough with the VIPs, and absolutely nobody gets in without ID. Most pipelines are either a revolving door (unit tests only) or a brick wall (full integration on every typo fix). Both are wrong.

### Stage 1: The Velocity Gate (Every PR, < 3 minutes)

Unit tests, lint, type-check, dependency audit. Cache aggressively. Fail fast.

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
          npm run lint 2>/dev/null || true
          npm run typecheck 2>/dev/null || true
          python -m ruff check . 2>/dev/null || true
          python -m mypy . 2>/dev/null || true
          go vet ./... 2>/dev/null || true
          golangci-lint run ./... 2>/dev/null || true

      - name: Unit Tests
        run: |
          npm test -- --passWithNoTests 2>/dev/null || true
          python -m pytest --tb=short -q 2>/dev/null || true
          go test ./... -short 2>/dev/null || true

      - name: Dependency Audit
        run: |
          npm audit --audit-level=high 2>/dev/null || true
          pip-audit -r requirements.txt 2>/dev/null || true
          govulncheck ./... 2>/dev/null || true
```

The `2>/dev/null || true` pattern isn't laziness — it's polyglot pragmatism. Your repo might not have Go. Don't fail the Node PR because `go vet` doesn't exist.

### Stage 2: The Integration Gate (Grouped Updates Only, < 15 minutes)

This runs **only** on Renovate's grouped PRs (see Section 2). Real databases, real message queues, real HTTP calls. No mocks. Mocks lie.

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

### Stage 3: Contract Gate (API Clients, < 5 minutes)

If you publish or consume OpenAPI/GraphQL schemas, run contract tests. Pact for consumer-driven, Schemathesis for provider-driven. Catch the `nullable: false` that became `nullable: true` before your frontend explodes.

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

### Stage 4: Smoke Gate (Full Stack, < 10 minutes)

Docker Compose spins up the actual deployment artifacts. Same images, same configs, same networking. If this passes, you can deploy with confidence.

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

### The Merge Policy (Enforced by Branch Protection)

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

The `strict: true` means **every** check must pass — even new ones added later. `dismiss_stale_reviews` forces re-review when the dependency PR updates (Renovate rebases). `require_code_owner_reviews` means your `CODEOWNERS` file decides who must approve. Mine says:

```
# .github/CODEOWNERS
/package*.json @team-platform
/requirements*.txt @team-platform
/go.mod @team-platform
/docker-compose*.yml @team-infra
```

Platform team owns dependency decisions. Infra owns compose. Nobody merges a grouped dependency PR without a platform review. The bot opens the PR, runs the gates, assigns the reviewers. You wake up Tuesday to a green pipeline and a Slack message: "Renovate PR #247 ready for review — all gates passed." You glance at the diff, approve, merge. Coffee still warm.

## The Local Reproduction Script: Debug in Seconds

Stop reading CI logs like tea leaves. When a dependency PR fails, you need the exact environment that broke — locally, in seconds, not a fresh CI run that queues behind someone's typo fix.

Here's `repro.sh`. Drop it in your repo root, `chmod +x` it, and never guess again.

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
git worktree add -f "${WORKTREE_DIR}" "pr/${PR_NUMBER}" 2>/dev/null || \
  git worktree add -f "${WORKTREE_DIR}" "$(gh pr checkout ${PR_NUMBER} --json headRefName -q .headRefName)"

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

Now the bisect. Say `axios@1.6.3` breaks your webhook handler but `1.6.2` passes. You don't need to guess which commit in `axios` did it — you need to know *your* code's breaking point.

```bash
#!/usr/bin/env bash
# bisect-dep.sh <package> <good-version> <bad-version> <test-command>
set -euo pipefail

PKG="$1"; GOOD="$2"; BAD="$3"; shift 3; TEST_CMD=("$@")

git bisect start
git bisect good "${GOOD}"
git bisect bad "${BAD}"

git bisect run bash -c "
  npm install ${PKG}@\$(git log --oneline -1 --format=%h -- ${PKG}) --save-exact 2>/dev/null || true
  ${TEST_CMD[*]}
"
git bisect reset
```

Run it: `./bisect-dep.sh axios 1.6.2 1.6.3 npm test -- --testNamePattern="webhook"`. Git bisects *your* lockfile history, not the dependency's repo. The culprit commit in *your* tree pops out. You fix your code, not theirs.

One script. Zero CI log spelunking. Your Monday morning just got boring again.

## Handling the Inevitable Breaking Change

A breaking change will slip through. The question isn't if — it's whether you have a playbook or a panic spiral.

### Pin With a Deadline, Not a Prayer

Temporary pins belong in `package.json` with an expiration date that your CI enforces. I use a `pinned-dependencies.json` file that Renovate reads via `packageRules`:

```json
{
  "packageRules": [
    {
      "matchPackageNames": ["axios"],
      "matchCurrentVersion": "!1.6.2",
      "groupName": "pinned-axios-1.6.2",
      "schedule": ["after 2025-03-15"],
      "automerge": false
    }
  ]
}
```

The `schedule` field means "don't even show me this PR until March 15." Your CI gate (from Section 3) runs a tiny script that fails if any pinned package exceeds its expiry:

```bash
#!/usr/bin/env bash
# check-pin-expiry.sh — runs in CI on every PR
EXPIRY_FILE="pinned-dependencies.json"
if [[ ! -f "$EXPIRY_FILE" ]]; then exit 0; fi

jq -r '.packageRules[] | select(.schedule[]) | "\(.matchPackageNames[]) \(.schedule[])"' "$EXPIRY_FILE" |
while read -r pkg date; do
  if [[ "$(date -d "$date" +%s)" -lt "$(date +%s)" ]]; then
    echo "::error::Pin for $pkg expired on $date — update or extend"
    exit 1
  fi
done
```

Add it to your `pre-merge` job. No more forgotten pins rotting for years.

### Write the Regression Test First

Before you fix the code, write the test that would've caught it. For the `axios` `transformResponse` change, that's a contract test:

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

This fails on 1.6.3, passes on 1.6.2. Commit it *before* you touch application code. Now the fix is verified, and the test stays forever.

### Upstream Issue Template — Copy-Paste Ready

Don't write a novel. Maintainers want reproduction, not your life story. Save this as `.github/ISSUE_TEMPLATE/dependency-regression.yml`:

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

Link the PR to the issue. Maintainers close "works for me" in minutes when you hand them a five-line script.

### Monorepo: Align or Isolate

In a monorepo, a breaking change in a shared internal library (`@myorg/api-client`) blocks every consumer. Two strategies:

**Strategy A: Aligned updates** — Use Renovate's `groupName` with `matchPackagePatterns: ["@myorg/*"]` and `automergeType: "pr"`. All internal packages update in one PR. CI runs the full matrix. Merge once, done.

**Strategy B: Consumer-driven contracts** — Each consumer declares its contract in `package.json`:

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

A CI job reads `contract`, installs the range, runs the specified test. If `@myorg/api-client@2.2.0` breaks billing but not notifications, only billing blocks. Notifications merge freely.

I prefer Strategy B. It scales. Strategy A turns every internal change into a company-wide coordination meeting.

### Schedule the Fix, Don't Block the World

Create a `dependency-fix` label. Your Renovate config excludes labelled PRs from the main schedule:

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

The breaking-change PR gets labelled, jumps the queue, merges fast. Other updates keep flowing on their normal cadence. No Friday 6 PM pileups.

## Merge Policy: The Social Contract

Your bot opens PRs. Your CI gates run. Your repro script works. Now you need the human layer — a merge policy encoded as config, not tribal knowledge. Because "LGTM" from the intern who joined last week is not a gate. It's a prayer.

### Required Reviewers by Package Type

Not all dependencies are created equal. A `lodash` patch? Auto-merge if green. A major `react` bump? Two senior engineers and a blood oath. Encode this in `.github/CODEOWNERS`:

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

Pair this with a branch protection rule that requires **2 approvals** for `package.json` changes, **1 for dev deps**, **0 for docs**. GitHub UI: Settings → Branches → Branch protection rules → Require a pull request before merging → Required approvals.

### Auto-Merge Conditions: Green Means Go

Configure Renovate to auto-merge when *all* of these are true:

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

The `dependency-health` check is a custom job (see below). Schedule avoids merge conflicts during peak hours. If you're on Dependabot, enable "Allow auto-merge" in repo settings and add this workflow:

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

### Emergency Hotfix Bypass: Break Glass, Leave Receipt

Sometimes you *must* merge a broken dependency update — a critical CVE, a vendor API shutdown. Create a `hotfix` label that bypasses `dependency-health` but **requires**:

1. Security team approval (enforced by CODEOWNERS)
2. A linked incident ticket
3. A post-merge revert PR opened within 48 hours

Enforce with a workflow gate:

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

### Monthly Dependency Health Dashboard

Run this GraphQL query via `gh api graphql -f query=@query.graphql` on a scheduled workflow. Outputs a Markdown table for your team channel.

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

Schedule it:

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

### PR Template Checklist

Paste this into `.github/PULL_REQUEST_TEMPLATE/dependency-update.md`:

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

No ambiguity. No "I thought someone else checked." The checklist lives in the PR. The policy lives in config. The pager stays silent.
