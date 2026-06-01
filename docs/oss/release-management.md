# Release Management

AIAGET is currently maintained from the default branch while public release
lines are being prepared. Releases should make deployment expectations,
security notes, and migration steps explicit.

## Release Cadence

Until the project reaches a stable public release line, maintainers may cut
preview releases when the default branch has a green CI signal and a coherent
set of user-facing improvements.

Release blockers include:

- Failing CI on the default branch
- Known authentication, tenant isolation, RBAC, or secret-handling regressions
- Unsafe production defaults or deployment template regressions
- Broken database migrations or seed contracts
- Missing upgrade or migration notes for a breaking change

## Release Checklist

Before tagging a release:

- Confirm CI is green on the release commit.
- Run the relevant production template checks from [README.md](../../README.md).
- Confirm example env files do not contain real secrets or private hosts.
- Review migrations, seed behavior, and rollback notes.
- Update release notes with user-facing changes, breaking changes, security
  notes, and verification commands.
- Confirm docs describe any new required environment variables or services.

## Version Notes

Release notes should include:

- Summary
- Added, changed, fixed, and security sections
- Migration steps
- Deployment notes
- Known limitations
- Verification commands

Security fixes should avoid publishing exploit details until affected users have
a reasonable upgrade path.
