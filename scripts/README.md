# Scripts

Local development, maintenance, and delivery scripts live here.

## Production Environment Validation

`validate-production-env.mjs` checks a production env file before Compose or application startup. It fails on missing required values, placeholder secrets, weak production secrets, invalid URLs, invalid ports, and unsupported workflow/runtime modes.

```bash
node scripts/validate-production-env.mjs .env.production
```

The script is intentionally local and dependency-free. It does not connect to external services and does not start containers.

Run its focused tests with:

```bash
node --test scripts/tests/validate-production-env.test.mjs
```
