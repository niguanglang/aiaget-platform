# Nginx

The production Compose template publishes the Web Console, Control API, and Runtime directly for simple private deployments. In production, put an external reverse proxy or ingress in front of them.

Recommended routing:

```text
https://console.example.com/        -> web:3000
https://api.example.com/api/v1      -> control-api:3001/api/v1
https://api.example.com/api/docs    -> control-api:3001/api/docs
https://runtime.example.com/runtime -> agent-runtime:8000/runtime
```

Required proxy behavior:

- Preserve `Authorization`, `x-api-key`, `x-request-id`, `x-trace-id`, and `traceparent` headers.
- Disable response buffering for SSE routes:
  - `/api/v1/conversations/*/messages/stream`
  - `/api/v1/external/*/stream`
  - `/runtime/conversations/respond-stream`
- Forward raw request bodies for IM channel callbacks so signature verification can use the original payload.
- Terminate TLS at the proxy or ingress and set `CORS_ORIGIN` to the public console origin.

Do not commit real TLS certificates or private keys to this directory.
