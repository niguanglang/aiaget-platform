# Environment Files

Private deployment environment files belong here. Keep real secrets out of git and use the repository templates as public examples.

Templates:

- `.env.example`: local development shape.
- `.env.production.example`: production deployment shape for `deploy/docker-compose.production.yml`.

Production workflow:

```bash
cp .env.production.example .env.production
node scripts/validate-production-env.mjs .env.production
docker compose -f deploy/docker-compose.production.yml --env-file .env.production config
```

Rules:

- Do not commit `.env.production` or any file containing real secrets.
- Do not add local PostgreSQL, Redis, MinIO, Qdrant, OpenSearch, Temporal, or observability containers without explicit operator approval.
- Keep `DATABASE_URL` pointed at the approved PostgreSQL instance.
- Rotate `JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET`, `MODEL_KEY_ENCRYPTION_SECRET`, `SECRET_ENCRYPTION_KEY`, and `RUNTIME_INTERNAL_TOKEN` before any public or customer-facing deployment.
