ALTER TABLE "permission" ADD COLUMN "resource" VARCHAR(80) NOT NULL DEFAULT '';

CREATE INDEX "permission_resource_idx" ON "permission"("resource");
CREATE INDEX "permission_action_idx" ON "permission"("action");

UPDATE "permission"
SET
  "code" = CASE "code"
    WHEN 'dashboard.read' THEN 'dashboard:overview:view'
    WHEN 'settings.read' THEN 'system:settings:view'
    WHEN 'tenant.read' THEN 'system:tenant:view'
    WHEN 'tenant.write' THEN 'system:tenant:manage'
    WHEN 'role.read' THEN 'system:role:view'
    WHEN 'department.read' THEN 'system:department:view'
    WHEN 'department.write' THEN 'system:department:manage'
    WHEN 'menu.read' THEN 'system:menu:view'
    WHEN 'menu.write' THEN 'system:menu:manage'
    WHEN 'api_key.read' THEN 'system:api_key:view'
    WHEN 'api_key.write' THEN 'system:api_key:manage'
    WHEN 'user.read' THEN 'system:user:view'
    WHEN 'user.write' THEN 'system:user:manage'
    WHEN 'storage.read' THEN 'storage:object:view'
    WHEN 'storage.write' THEN 'storage:object:manage'
    WHEN 'security_policy.read' THEN 'security:rule:view'
    WHEN 'security_policy.write' THEN 'security:rule:manage'
    WHEN 'agent.read' THEN 'agent:agent:view'
    WHEN 'agent.write' THEN 'agent:agent:manage'
    WHEN 'prompt.read' THEN 'prompt:template:view'
    WHEN 'prompt.write' THEN 'prompt:template:manage'
    WHEN 'model.read' THEN 'model:config:view'
    WHEN 'model.write' THEN 'model:config:manage'
    WHEN 'knowledge.read' THEN 'knowledge:base:view'
    WHEN 'knowledge.write' THEN 'knowledge:base:manage'
    WHEN 'tool.read' THEN 'tool:definition:view'
    WHEN 'tool.write' THEN 'tool:definition:manage'
    WHEN 'approval.read' THEN 'security:approval:view'
    WHEN 'approval.write' THEN 'security:approval:handle'
    WHEN 'conversation.read' THEN 'conversation:history:view'
    WHEN 'conversation.write' THEN 'conversation:chat:manage'
    WHEN 'monitor.read' THEN 'monitor:log:view'
    WHEN 'audit.read' THEN 'security:audit:view'
    ELSE "code"
  END,
  "name" = CASE "code"
    WHEN 'dashboard.read' THEN 'Dashboard Overview View'
    WHEN 'settings.read' THEN 'System Settings View'
    WHEN 'tenant.read' THEN 'System Tenant View'
    WHEN 'tenant.write' THEN 'System Tenant Manage'
    WHEN 'role.read' THEN 'System Role View'
    WHEN 'department.read' THEN 'System Department View'
    WHEN 'department.write' THEN 'System Department Manage'
    WHEN 'menu.read' THEN 'System Menu View'
    WHEN 'menu.write' THEN 'System Menu Manage'
    WHEN 'api_key.read' THEN 'System API Key View'
    WHEN 'api_key.write' THEN 'System API Key Manage'
    WHEN 'user.read' THEN 'System User View'
    WHEN 'user.write' THEN 'System User Manage'
    WHEN 'storage.read' THEN 'Storage Object View'
    WHEN 'storage.write' THEN 'Storage Object Manage'
    WHEN 'security_policy.read' THEN 'Security Rule View'
    WHEN 'security_policy.write' THEN 'Security Rule Manage'
    WHEN 'agent.read' THEN 'Agent View'
    WHEN 'agent.write' THEN 'Agent Manage'
    WHEN 'prompt.read' THEN 'Prompt Template View'
    WHEN 'prompt.write' THEN 'Prompt Template Manage'
    WHEN 'model.read' THEN 'Model Config View'
    WHEN 'model.write' THEN 'Model Config Manage'
    WHEN 'knowledge.read' THEN 'Knowledge Base View'
    WHEN 'knowledge.write' THEN 'Knowledge Base Manage'
    WHEN 'tool.read' THEN 'Tool Definition View'
    WHEN 'tool.write' THEN 'Tool Definition Manage'
    WHEN 'approval.read' THEN 'Security Approval View'
    WHEN 'approval.write' THEN 'Security Approval Handle'
    WHEN 'conversation.read' THEN 'Conversation History View'
    WHEN 'conversation.write' THEN 'Conversation Chat Manage'
    WHEN 'monitor.read' THEN 'Monitor Log View'
    WHEN 'audit.read' THEN 'Security Audit View'
    ELSE "name"
  END,
  "module" = CASE "code"
    WHEN 'settings.read' THEN 'system'
    WHEN 'tenant.read' THEN 'system'
    WHEN 'tenant.write' THEN 'system'
    WHEN 'role.read' THEN 'system'
    WHEN 'department.read' THEN 'system'
    WHEN 'department.write' THEN 'system'
    WHEN 'menu.read' THEN 'system'
    WHEN 'menu.write' THEN 'system'
    WHEN 'api_key.read' THEN 'system'
    WHEN 'api_key.write' THEN 'system'
    WHEN 'user.read' THEN 'system'
    WHEN 'user.write' THEN 'system'
    WHEN 'security_policy.read' THEN 'security'
    WHEN 'security_policy.write' THEN 'security'
    WHEN 'approval.read' THEN 'security'
    WHEN 'approval.write' THEN 'security'
    WHEN 'audit.read' THEN 'security'
    ELSE "module"
  END,
  "resource" = CASE "code"
    WHEN 'dashboard.read' THEN 'overview'
    WHEN 'settings.read' THEN 'settings'
    WHEN 'tenant.read' THEN 'tenant'
    WHEN 'tenant.write' THEN 'tenant'
    WHEN 'role.read' THEN 'role'
    WHEN 'department.read' THEN 'department'
    WHEN 'department.write' THEN 'department'
    WHEN 'menu.read' THEN 'menu'
    WHEN 'menu.write' THEN 'menu'
    WHEN 'api_key.read' THEN 'api_key'
    WHEN 'api_key.write' THEN 'api_key'
    WHEN 'user.read' THEN 'user'
    WHEN 'user.write' THEN 'user'
    WHEN 'storage.read' THEN 'object'
    WHEN 'storage.write' THEN 'object'
    WHEN 'security_policy.read' THEN 'rule'
    WHEN 'security_policy.write' THEN 'rule'
    WHEN 'agent.read' THEN 'agent'
    WHEN 'agent.write' THEN 'agent'
    WHEN 'prompt.read' THEN 'template'
    WHEN 'prompt.write' THEN 'template'
    WHEN 'model.read' THEN 'config'
    WHEN 'model.write' THEN 'config'
    WHEN 'knowledge.read' THEN 'base'
    WHEN 'knowledge.write' THEN 'base'
    WHEN 'tool.read' THEN 'definition'
    WHEN 'tool.write' THEN 'definition'
    WHEN 'approval.read' THEN 'approval'
    WHEN 'approval.write' THEN 'approval'
    WHEN 'conversation.read' THEN 'history'
    WHEN 'conversation.write' THEN 'chat'
    WHEN 'monitor.read' THEN 'log'
    WHEN 'audit.read' THEN 'audit'
    ELSE COALESCE(NULLIF("resource", ''), split_part("code", ':', 2))
  END,
  "action" = CASE "code"
    WHEN 'dashboard.read' THEN 'view'
    WHEN 'settings.read' THEN 'view'
    WHEN 'tenant.read' THEN 'view'
    WHEN 'tenant.write' THEN 'manage'
    WHEN 'role.read' THEN 'view'
    WHEN 'department.read' THEN 'view'
    WHEN 'department.write' THEN 'manage'
    WHEN 'menu.read' THEN 'view'
    WHEN 'menu.write' THEN 'manage'
    WHEN 'api_key.read' THEN 'view'
    WHEN 'api_key.write' THEN 'manage'
    WHEN 'user.read' THEN 'view'
    WHEN 'user.write' THEN 'manage'
    WHEN 'storage.read' THEN 'view'
    WHEN 'storage.write' THEN 'manage'
    WHEN 'security_policy.read' THEN 'view'
    WHEN 'security_policy.write' THEN 'manage'
    WHEN 'agent.read' THEN 'view'
    WHEN 'agent.write' THEN 'manage'
    WHEN 'prompt.read' THEN 'view'
    WHEN 'prompt.write' THEN 'manage'
    WHEN 'model.read' THEN 'view'
    WHEN 'model.write' THEN 'manage'
    WHEN 'knowledge.read' THEN 'view'
    WHEN 'knowledge.write' THEN 'manage'
    WHEN 'tool.read' THEN 'view'
    WHEN 'tool.write' THEN 'manage'
    WHEN 'approval.read' THEN 'view'
    WHEN 'approval.write' THEN 'handle'
    WHEN 'conversation.read' THEN 'view'
    WHEN 'conversation.write' THEN 'manage'
    WHEN 'monitor.read' THEN 'view'
    WHEN 'audit.read' THEN 'view'
    ELSE "action"
  END,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "code" IN (
  'dashboard.read',
  'settings.read',
  'tenant.read',
  'tenant.write',
  'role.read',
  'department.read',
  'department.write',
  'menu.read',
  'menu.write',
  'api_key.read',
  'api_key.write',
  'user.read',
  'user.write',
  'storage.read',
  'storage.write',
  'security_policy.read',
  'security_policy.write',
  'agent.read',
  'agent.write',
  'prompt.read',
  'prompt.write',
  'model.read',
  'model.write',
  'knowledge.read',
  'knowledge.write',
  'tool.read',
  'tool.write',
  'approval.read',
  'approval.write',
  'conversation.read',
  'conversation.write',
  'monitor.read',
  'audit.read'
);

UPDATE "menu"
SET
  "permission_code" = CASE "permission_code"
    WHEN 'dashboard.read' THEN 'dashboard:overview:view'
    WHEN 'settings.read' THEN 'system:settings:view'
    WHEN 'tenant.read' THEN 'system:tenant:view'
    WHEN 'tenant.write' THEN 'system:tenant:manage'
    WHEN 'role.read' THEN 'system:role:view'
    WHEN 'department.read' THEN 'system:department:view'
    WHEN 'department.write' THEN 'system:department:manage'
    WHEN 'menu.read' THEN 'system:menu:view'
    WHEN 'menu.write' THEN 'system:menu:manage'
    WHEN 'api_key.read' THEN 'system:api_key:view'
    WHEN 'api_key.write' THEN 'system:api_key:manage'
    WHEN 'user.read' THEN 'system:user:view'
    WHEN 'user.write' THEN 'system:user:manage'
    WHEN 'storage.read' THEN 'storage:object:view'
    WHEN 'storage.write' THEN 'storage:object:manage'
    WHEN 'security_policy.read' THEN 'security:rule:view'
    WHEN 'security_policy.write' THEN 'security:rule:manage'
    WHEN 'agent.read' THEN 'agent:agent:view'
    WHEN 'agent.write' THEN 'agent:agent:manage'
    WHEN 'prompt.read' THEN 'prompt:template:view'
    WHEN 'prompt.write' THEN 'prompt:template:manage'
    WHEN 'model.read' THEN 'model:config:view'
    WHEN 'model.write' THEN 'model:config:manage'
    WHEN 'knowledge.read' THEN 'knowledge:base:view'
    WHEN 'knowledge.write' THEN 'knowledge:base:manage'
    WHEN 'tool.read' THEN 'tool:definition:view'
    WHEN 'tool.write' THEN 'tool:definition:manage'
    WHEN 'approval.read' THEN 'security:approval:view'
    WHEN 'approval.write' THEN 'security:approval:handle'
    WHEN 'conversation.read' THEN 'conversation:history:view'
    WHEN 'conversation.write' THEN 'conversation:chat:manage'
    WHEN 'monitor.read' THEN 'monitor:log:view'
    WHEN 'audit.read' THEN 'security:audit:view'
    ELSE "permission_code"
  END,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "permission_code" IN (
  'dashboard.read',
  'settings.read',
  'tenant.read',
  'tenant.write',
  'role.read',
  'department.read',
  'department.write',
  'menu.read',
  'menu.write',
  'api_key.read',
  'api_key.write',
  'user.read',
  'user.write',
  'storage.read',
  'storage.write',
  'security_policy.read',
  'security_policy.write',
  'agent.read',
  'agent.write',
  'prompt.read',
  'prompt.write',
  'model.read',
  'model.write',
  'knowledge.read',
  'knowledge.write',
  'tool.read',
  'tool.write',
  'approval.read',
  'approval.write',
  'conversation.read',
  'conversation.write',
  'monitor.read',
  'audit.read'
);

COMMENT ON COLUMN "permission"."resource" IS '权限资源编码，配合 module 和 action 组成 module:resource:action 标准权限编码。';
COMMENT ON COLUMN "permission"."code" IS '权限编码，采用 module:resource:action 格式。';
COMMENT ON COLUMN "permission"."module" IS '权限所属模块。';
COMMENT ON COLUMN "permission"."action" IS '权限动作。';
