# Contributing

Thanks for helping improve AIAGET. This project is a TypeScript and Python
monorepo, so small, focused changes are easier to review and keep stable.

## Development Setup

Prerequisites:

- Node.js 22+
- pnpm 10+
- Python 3.11+
- Docker and Docker Compose for optional local middleware

Bootstrap:

```bash
cp .env.example .env
pnpm install
pnpm typecheck
pnpm test
```

Runtime service setup:

```bash
cd apps/agent-runtime
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m pytest tests
```

## Pull Requests

- Open an issue first for large behavior changes, new modules, or changes that
  affect deployment, authentication, security boundaries, or data migrations.
- Keep pull requests scoped to one clear problem.
- Explain affected areas, risk, verification commands, and release impact.
- Update docs when behavior, configuration, deployment steps, or public APIs
  change.
- Add or update tests for bug fixes and user-facing behavior.
- Never commit real `.env` files, private keys, production credentials, or
  customer data. Use placeholder values in example files.
- Expect additional review for authentication, tenant isolation, RBAC, resource
  ACL, secret handling, SSRF, tool execution, plugin, storage, migration, and
  deployment-template changes.

Maintainers use [GOVERNANCE.md](./GOVERNANCE.md),
[MAINTAINERS.md](./MAINTAINERS.md), and
[docs/oss/maintenance-policy.md](./docs/oss/maintenance-policy.md) to guide PR
review, issue triage, and release responsibilities.

## Issue Triage

Use the bug or feature templates and include the smallest reproducible case.
Maintainers triage issues by affected area, severity, release impact, and
whether the report contains enough sanitized evidence to act on.

Do not open public issues for vulnerabilities or suspected credential leaks.
Use the private reporting process in [SECURITY.md](./SECURITY.md).

## Verification

Run the narrowest relevant checks while developing. Before requesting review,
run the broader checks that apply to the files you changed:

```bash
pnpm lint
pnpm typecheck
pnpm test
python3 -m pytest apps/agent-runtime/tests
python3 -m compileall apps/agent-runtime/app
```

Production template checks:

```bash
cp .env.production.example .env.production
node scripts/validate-production-env.mjs .env.production
pnpm verify:prod-template
```

## Commit Style

Use short, imperative commit messages with a clear scope when useful:

```text
feat(control-api): add model channel routing
fix(web): preserve auth state during refresh
docs: clarify production deployment template
```

## Reporting Security Issues

Do not open public issues for vulnerabilities. See [SECURITY.md](./SECURITY.md)
for the disclosure process.
