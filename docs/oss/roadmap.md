# Open Source Roadmap

This roadmap explains why AIAGET has continuing open source maintenance work
and where maintainer effort is expected.

## Near-Term Priorities

- Stabilize public setup documentation for self-hosted deployments.
- Strengthen production readiness checks for environment files, compose
  templates, observability, and migration safety.
- Expand contract tests around authentication, tenant isolation, RBAC, resource
  ACLs, tool execution, model-provider credentials, and runtime workflows.
- Improve issue reproduction paths for Web Console, Control API, Agent Runtime,
  SDK, and deployment reports.
- Prepare preview release notes and upgrade guidance.

## Ecosystem Value

AIAGET is intended to be an inspectable reference for teams building
self-hosted enterprise agent platforms. The project combines model governance,
RAG operations, prompt management, tool approvals, conversation tracing, audit
logs, and runtime observability in one repository.

That scope creates ongoing maintenance needs across TypeScript, Python,
database schema, deployment, documentation, and security review.

## How Codex Helps

Codex can help maintainers:

- Review cross-service PRs for consistency and regressions
- Improve tests and reproduction cases
- Audit security-sensitive changes
- Keep deployment and release documentation current
- Triage issues across frontend, backend, runtime, and infrastructure areas
