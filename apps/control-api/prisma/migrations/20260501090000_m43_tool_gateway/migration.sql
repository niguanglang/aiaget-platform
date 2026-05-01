INSERT INTO "permission" ("id", "tenant_id", "code", "name", "module", "resource", "action", "created_at", "updated_at")
SELECT gen_random_uuid(), t."id", 'tool:call:execute', 'Tool Call Execute', 'tool', 'call', 'execute', now(), now()
FROM "tenant" t
WHERE NOT EXISTS (
  SELECT 1
  FROM "permission" p
  WHERE p."tenant_id" = t."id"
    AND p."code" = 'tool:call:execute'
);

INSERT INTO "role_permission" ("id", "tenant_id", "role_id", "permission_id", "created_at", "updated_at")
SELECT gen_random_uuid(), r."tenant_id", r."id", p."id", now(), now()
FROM "role" r
JOIN "permission" p
  ON p."tenant_id" = r."tenant_id"
 AND p."code" = 'tool:call:execute'
WHERE r."code" IN ('tenant_admin', 'tenant_operator')
  AND r."deleted_at" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "role_permission" rp
    WHERE rp."tenant_id" = r."tenant_id"
      AND rp."role_id" = r."id"
      AND rp."permission_id" = p."id"
  );

COMMENT ON COLUMN "tool_call_log"."request_headers" IS '工具网关实际发起请求时的请求头快照，包含 traceparent、x-trace-id 等链路追踪头。';
COMMENT ON COLUMN "tool_call_log"."response_body" IS '工具网关响应体快照；超出 TOOL_GATEWAY_MAX_RESPONSE_CHARS 时保存截断预览。';
COMMENT ON COLUMN "tool_call_log"."error_message" IS '工具网关执行失败、审批拦截、限流拦截或安全策略拒绝原因。';
