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
- Update docs when behavior, configuration, deployment steps, or public APIs
  change.
- Add or update tests for bug fixes and user-facing behavior.
- Never commit real `.env` files, private keys, production credentials, or
  customer data. Use placeholder values in example files.

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
