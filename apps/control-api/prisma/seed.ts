import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const defaultTenantCode = process.env.DEFAULT_TENANT_CODE ?? 'default';
const defaultTenantName = process.env.DEFAULT_TENANT_NAME ?? 'Default Enterprise';
const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL ?? 'oss-admin-7f4c2a@local.invalid';
const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? 'AIAgetDev!9sK4pQ7m';

const permissions = [
  ['dashboard.read', 'Dashboard Read', 'dashboard', 'read'],
  ['settings.read', 'Settings Read', 'settings', 'read'],
  ['tenant.read', 'Tenant Read', 'tenant', 'read'],
  ['user.read', 'User Read', 'user', 'read'],
  ['user.write', 'User Write', 'user', 'write'],
  ['agent.read', 'Agent Read', 'agent', 'read'],
  ['agent.write', 'Agent Write', 'agent', 'write'],
  ['prompt.read', 'Prompt Read', 'prompt', 'read'],
  ['model.read', 'Model Read', 'model', 'read'],
  ['model.write', 'Model Write', 'model', 'write'],
  ['knowledge.read', 'Knowledge Read', 'knowledge', 'read'],
  ['tool.read', 'Tool Read', 'tool', 'read'],
  ['conversation.read', 'Conversation Read', 'conversation', 'read'],
  ['monitor.read', 'Monitor Read', 'monitor', 'read'],
  ['audit.read', 'Audit Read', 'audit', 'read'],
] as const;

const roles = [
  {
    code: 'tenant_admin',
    name: 'Tenant Admin',
    description: 'Full access to the tenant workspace.',
    permissionCodes: permissions.map(([code]) => code),
  },
  {
    code: 'tenant_operator',
    name: 'Tenant Operator',
    description: 'Operational access without user write permissions.',
    permissionCodes: permissions
      .map(([code]) => code)
      .filter((code) => code !== 'user.write' && code !== 'audit.read'),
  },
  {
    code: 'tenant_viewer',
    name: 'Tenant Viewer',
    description: 'Read-only access to tenant console modules.',
    permissionCodes: permissions.map(([code]) => code).filter((code) => code.endsWith('.read')),
  },
] as const;

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: {
      code: defaultTenantCode,
    },
    create: {
      code: defaultTenantCode,
      name: defaultTenantName,
      status: 'ACTIVE',
    },
    update: {
      name: defaultTenantName,
      status: 'ACTIVE',
      deletedAt: null,
    },
  });

  for (const [code, name, module, action] of permissions) {
    await prisma.permission.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code,
        },
      },
      create: {
        tenantId: tenant.id,
        code,
        name,
        module,
        action,
      },
      update: {
        name,
        module,
        action,
        deletedAt: null,
      },
    });
  }

  const permissionRecords = await prisma.permission.findMany({
    where: {
      tenantId: tenant.id,
      deletedAt: null,
    },
  });
  const permissionByCode = new Map(permissionRecords.map((permission) => [permission.code, permission]));

  for (const role of roles) {
    const roleRecord = await prisma.role.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: role.code,
        },
      },
      create: {
        tenantId: tenant.id,
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
        deletedAt: null,
      },
    });

    await prisma.rolePermission.createMany({
      data: role.permissionCodes
        .map((permissionCode) => permissionByCode.get(permissionCode))
        .filter((permission): permission is NonNullable<typeof permission> => Boolean(permission))
        .map((permission) => ({
          tenantId: tenant.id,
          roleId: roleRecord.id,
          permissionId: permission.id,
        })),
      skipDuplicates: true,
    });
  }

  const adminPasswordHash = await hash(defaultAdminPassword, 12);
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: defaultAdminEmail,
      },
    },
    create: {
      tenantId: tenant.id,
      email: defaultAdminEmail,
      name: 'Default Admin',
      passwordHash: adminPasswordHash,
      status: 'ACTIVE',
    },
    update: {
      name: 'Default Admin',
      passwordHash: adminPasswordHash,
      status: 'ACTIVE',
      deletedAt: null,
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'tenant_admin',
      },
    },
  });

  await prisma.userRole.upsert({
    where: {
      tenantId_userId_roleId: {
        tenantId: tenant.id,
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    create: {
      tenantId: tenant.id,
      userId: admin.id,
      roleId: adminRole.id,
    },
    update: {
      deletedAt: null,
    },
  });

  for (const category of [
    {
      code: 'general',
      name: 'General Assistant',
      description: 'General purpose enterprise assistant agents.',
    },
    {
      code: 'operations',
      name: 'Operations',
      description: 'Operational support, monitoring, and workflow agents.',
    },
    {
      code: 'knowledge',
      name: 'Knowledge Expert',
      description: 'Knowledge-base oriented expert agents.',
    },
  ]) {
    await prisma.agentCategory.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: category.code,
        },
      },
      create: {
        tenantId: tenant.id,
        code: category.code,
        name: category.name,
        description: category.description,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      update: {
        name: category.name,
        description: category.description,
        deletedAt: null,
        updatedBy: admin.id,
      },
    });
  }

  console.log(
    `Seeded tenant "${defaultTenantCode}" with default admin "${defaultAdminEmail}". Password: "${defaultAdminPassword}"`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
