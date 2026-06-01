# Codex for OSS Application Notes

Last reviewed: 2026-06-01

Official OpenAI pages:

- Application form: https://openai.com/zh-Hans-CN/form/codex-for-oss/
- Program overview: https://developers.openai.com/community/codex-for-oss
- Program terms: https://developers.openai.com/codex/codex-for-oss-terms

## Repository Readiness

- [x] Public-ready README with setup, service layout, and verification commands
- [x] MIT license in `LICENSE`
- [x] Contribution guide in `CONTRIBUTING.md`
- [x] Security disclosure process in `SECURITY.md`
- [x] Code of conduct in `CODE_OF_CONDUCT.md`
- [x] Support policy in `SUPPORT.md`
- [x] GitHub issue and pull request templates
- [x] CI workflow for static checks and tests
- [x] `.env` and generated local artifacts ignored
- [x] GitHub repository created and set to public
- [ ] GitHub private vulnerability reporting enabled
- [x] Repository description and topics filled in
- [ ] Current worktree reviewed so only intended source, docs, and assets are committed
- [x] CI is green on the public default branch

## Application Draft

Project name:

```text
AIAGET
```

Repository URL:

```text
https://github.com/niguanglang/aiaget-platform
```

License:

```text
MIT
```

Short description:

```text
AIAGET is a private-deployable enterprise agent platform for managing agents,
model providers, prompts, knowledge bases, tools, conversations, approval
workflows, audit logs, and runtime observability across a TypeScript and Python
monorepo.
```

Why the project is relevant for Codex:

```text
AIAGET has broad open source maintenance surfaces: a Next.js console, NestJS
control plane, FastAPI/LangGraph runtime, Prisma data model, SDK package,
deployment templates, and a large contract-test suite. Codex would help
maintainers review cross-service changes, improve tests, triage issues,
document deployment paths, and keep security-sensitive agent workflows
consistent.
```

Expected open source impact:

```text
The project gives teams a self-hostable reference implementation for enterprise
agent operations: model access governance, prompt/version management,
retrieval, tool approvals, conversation tracing, auditability, and production
observability. Opening the repository allows maintainers and adopters to
inspect the implementation, reproduce deployments, file issues, and contribute
connectors, tests, and runtime improvements.
```

Maintainer role:

```text
Owner/maintainer of the AIAGET repository.
```

Project importance metrics:

```text
After the repository is public, add the current GitHub stars, forks, open
issues, contributors, package downloads if any, and a short note explaining
why AIAGET matters for self-hosted enterprise agent operations.
```

Verification commands to mention if requested:

```bash
pnpm lint
pnpm typecheck
pnpm test
python3 -m pytest apps/agent-runtime/tests
pnpm verify:prod-template
```

## Before Submitting

1. Confirm the repository is public before submitting the form.
2. Confirm the license choice with all rights holders.
3. Review images, example data, docs, and commit history for private data.
4. Enable GitHub security features available for public repositories.
5. Submit the OpenAI form with the public repository URL.
