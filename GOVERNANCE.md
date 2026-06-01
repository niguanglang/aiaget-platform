# Governance

AIAGET is maintained as a public open source project with a bias toward small,
reviewable changes, security-conscious defaults, and production deployment
clarity.

## Maintainer Responsibilities

Maintainers are responsible for:

- Reviewing pull requests for correctness, security impact, tests, and
  documentation.
- Triaging issues into reproducible bugs, enhancements, support questions,
  security reports, and release blockers.
- Keeping the default branch buildable and the public CI signal green.
- Managing releases, migration notes, and production deployment guidance.
- Protecting users from unsafe defaults, leaked secrets, and tenant isolation
  regressions.

The current repository owner and primary maintainer is the GitHub account
`niguanglang`.

## Decision Process

Small fixes can be merged after maintainer review and passing CI. Larger
changes should start with an issue or design note when they affect:

- Authentication, tenant isolation, RBAC, resource ACLs, or security policies
- Database schema or migrations
- Runtime execution, tool calls, plugins, or model-provider credentials
- Deployment templates, production defaults, or observability contracts
- Public APIs, SDK contracts, or documented workflows

Maintainers may ask for narrower scope, additional tests, migration notes, or a
security review before accepting a change.

## Issue Triage

Issues are reviewed with the process in
[docs/oss/maintenance-policy.md](./docs/oss/maintenance-policy.md). Public
issues should not contain credentials, customer data, private URLs, production
logs, or screenshots with private information.

Security vulnerabilities must use the private process in
[SECURITY.md](./SECURITY.md).

## Releases

Release planning and verification are documented in
[docs/oss/release-management.md](./docs/oss/release-management.md). Until the
project publishes stable release lines, the default branch is the primary
integration branch.
