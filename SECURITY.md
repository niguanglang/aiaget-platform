# Security Policy

## Supported Versions

Security fixes target the default branch until the project publishes versioned
release lines.

## Reporting a Vulnerability

Please do not report vulnerabilities through public GitHub issues.

Use GitHub private vulnerability reporting for this repository when available.
If it is not available, contact the maintainers through a private channel listed
on the repository profile and include:

- A short description of the issue and impact
- Reproduction steps or a proof of concept
- Affected commit, version, deployment mode, or configuration
- Whether the issue is already public or being exploited

Maintainers should acknowledge valid reports within 5 business days, coordinate
a fix, and publish remediation guidance after affected users have a reasonable
upgrade path.

## Secrets and Test Data

- Do not commit real `.env` files, API keys, private keys, production database
  URLs, customer content, or screenshots containing customer data.
- Keep example configuration values as placeholders.
- Rotate any secret that may have been committed or shared outside the trusted
  maintainer group.
