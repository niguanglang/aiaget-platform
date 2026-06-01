# Maintenance Policy

This document makes AIAGET's ongoing maintenance responsibilities explicit for
contributors, users, and program reviewers.

## Triage Cadence

Maintainers aim to review new issues and pull requests during regular project
maintenance windows. Security reports follow the response target in
[SECURITY.md](../../SECURITY.md).

Triage focuses on:

- Reproducibility and affected version or commit
- Affected area: Web, Control API, Runtime, SDK, deployment, docs, or security
- Severity: blocker, high, medium, low, or support
- Release impact and whether a workaround exists
- Whether logs, screenshots, or configuration have been sanitized

## Issue Categories

- Bug: reproducible behavior that differs from documented or expected behavior
- Enhancement: a scoped improvement with a clear user workflow
- Documentation: setup, deployment, API, or operational guidance
- Security: private report only, not public issues
- Support: usage question or environment-specific deployment help
- Release blocker: regression or production-readiness issue that should block a
  tagged release

## Pull Request Review

PR review checks:

- Scope is focused and understandable
- Relevant tests or verification commands are included
- Docs are updated for behavior, API, config, or deployment changes
- Security-sensitive changes call out auth, tenant isolation, secrets, SSRF,
  tool execution, plugin, storage, or migration risks
- CI is passing before merge

Maintainers may request smaller PRs when a change crosses several services or
changes security-sensitive contracts.

## Active Maintenance Evidence

The repository keeps public evidence of maintenance through:

- GitHub issues and pull requests
- CI runs on the default branch
- Product milestone docs in [docs/product](../product/README.md)
- Release process docs in [release-management.md](./release-management.md)
- Governance and maintainer records in [GOVERNANCE.md](../../GOVERNANCE.md) and
  [MAINTAINERS.md](../../MAINTAINERS.md)
