import type {
  CreatePluginInstallationInput,
  PluginInstallationStatus,
  PluginManifestValidationIssue,
  PluginManifestValidationResult,
  PluginRiskLevel,
  PluginSourceType,
  PluginToolBindingPreview,
} from '@aiaget/shared-types';

export interface PluginManifestPolicyInput {
  riskLevel: PluginRiskLevel;
  status: PluginInstallationStatus | string;
  manifest: Record<string, unknown> | null;
}

export interface PluginManifestPolicy {
  canEnable: boolean;
  reviewRequired: boolean;
  reviewStatus: string | null;
  reason: string | null;
  warnings: string[];
}

export interface PluginGeneratedCodes {
  menuCodes: string[];
  toolCodes: string[];
}

interface NormalizedToolPreview {
  code: string;
  name: string;
  method: string;
  url: string | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requireApproval: boolean;
  status: 'ACTIVE' | 'DISABLED';
}

export function buildPluginManifestPolicy(input: PluginManifestPolicyInput): PluginManifestPolicy {
  const reviewStatus = readSecurityReviewStatus(input.manifest);
  const reviewRequired = input.riskLevel === 'HIGH' || input.riskLevel === 'CRITICAL';
  const warnings: string[] = [];

  if (input.status === 'PENDING_REVIEW') {
    return {
      canEnable: false,
      reviewRequired: true,
      reviewStatus,
      reason: '插件仍处于待审核状态，完成安全审核后才能启用。',
      warnings,
    };
  }

  if (reviewRequired && reviewStatus !== 'APPROVED') {
    return {
      canEnable: false,
      reviewRequired,
      reviewStatus,
      reason: '高风险插件需要安全审核通过后才能启用。',
      warnings,
    };
  }

  if (input.riskLevel === 'CRITICAL') {
    warnings.push('极高风险插件启用后仍需持续关注 Hook、菜单和工具调用审计。');
  }

  return {
    canEnable: true,
    reviewRequired,
    reviewStatus,
    reason: null,
    warnings,
  };
}

export function buildPluginGeneratedCodes(pluginCode: string, manifest: Record<string, unknown> | null): PluginGeneratedCodes {
  return {
    menuCodes: extractManifestCodes(manifest, ['menus', 'menu_bindings', 'menu_entries'], ['code', 'menu_code'])
      .map((code) => buildNamespacedCode('plugin', pluginCode, code, 100)),
    toolCodes: extractManifestCodes(manifest, ['tools', 'actions', 'capabilities'], ['code', 'tool_code'])
      .map((code) => buildNamespacedCode('plugin_tool', pluginCode, code, 100)),
  };
}

export function validatePluginManifestInput(input: CreatePluginInstallationInput): PluginManifestValidationResult {
  const manifest = isRecord(input.manifest_json) ? input.manifest_json : {};
  const sourceType = normalizeSourceType(input.source_type);
  const manifestCode = normalizeManifestCode(readFirstString(manifest, ['code', 'plugin_code']) ?? input.code ?? 'plugin');
  const version = normalizeVersion(readFirstString(manifest, ['version', 'latest_version']) ?? input.latest_version ?? '1.0.0');
  const riskLevel = normalizePluginRiskLevel(readFirstString(manifest, ['risk_level', 'risk']) ?? input.risk_level ?? null);
  const packageMetadata = readPackageMetadata(manifest);
  const errors: PluginManifestValidationIssue[] = [];
  const warnings: PluginManifestValidationIssue[] = [];
  const permissions = uniqueStrings([
    ...readStringArray(manifest, ['permissions', 'permission_codes', 'permission_preview']),
    ...(Array.isArray(input.permission_preview) ? input.permission_preview : []),
  ]);
  const menuCodes = extractManifestCodes(manifest, ['menus', 'menu_bindings', 'menu_entries'], ['code', 'menu_code']);
  const hookCodes = extractManifestCodes(manifest, ['hooks'], ['code', 'hook_code']);
  const tools = readToolPreviews(manifest, errors, warnings);

  if (!manifestCode || manifestCode === 'plugin') {
    errors.push(buildValidationIssue('MANIFEST_CODE_REQUIRED', 'ERROR', 'code', 'Manifest 必须声明稳定的插件 code。'));
  }

  if (sourceType === 'CUSTOM') {
    if (!packageMetadata.sourceUrl) {
      errors.push(buildValidationIssue('PACKAGE_SOURCE_REQUIRED', 'ERROR', 'package.source_url', '自定义插件必须声明安装包来源。'));
    }
    if (!packageMetadata.sha256) {
      errors.push(buildValidationIssue('PACKAGE_SHA256_REQUIRED', 'ERROR', 'package.sha256', '自定义插件必须声明安装包 sha256。'));
    } else if (!/^[a-f0-9]{64}$/i.test(packageMetadata.sha256)) {
      errors.push(buildValidationIssue('PACKAGE_SHA256_INVALID', 'ERROR', 'package.sha256', '安装包 sha256 必须是 64 位十六进制字符串。'));
    }
    if (!packageMetadata.signature) {
      errors.push(buildValidationIssue('PACKAGE_SIGNATURE_REQUIRED', 'ERROR', 'package.signature', '自定义插件必须声明签名或验签凭据。'));
    }
  }

  if (sourceType === 'MARKET' && packageMetadata.sourceUrl && !packageMetadata.sha256) {
    warnings.push(buildValidationIssue('PACKAGE_SHA256_RECOMMENDED', 'WARN', 'package.sha256', '市场插件声明了包来源，建议同时声明 sha256。'));
  }

  if (permissions.length === 0) {
    warnings.push(buildValidationIssue('PERMISSION_PREVIEW_EMPTY', 'WARN', 'permissions', '插件未声明权限预览，安装审批时缺少最小权限说明。'));
  }

  const toolBindings: PluginToolBindingPreview[] = tools.map((tool) => ({
    code: tool.code,
    name: tool.name,
    generated_tool_code: buildNamespacedCode('plugin_tool', manifestCode, tool.code, 100),
    gateway: 'TOOL_GATEWAY',
    method: tool.method,
    url: tool.url,
    risk_level: tool.riskLevel,
    require_approval: tool.requireApproval,
    status: tool.status,
  }));
  const status = errors.length === 0 ? 'PASSED' : 'FAILED';

  return {
    status,
    can_install: status === 'PASSED',
    source_type: sourceType,
    manifest_code: manifestCode,
    version,
    risk_level: riskLevel,
    package_source: packageMetadata.sourceUrl,
    package_sha256: packageMetadata.sha256,
    signature_present: Boolean(packageMetadata.signature),
    permission_codes: permissions,
    menu_codes: menuCodes.map((code) => buildNamespacedCode('plugin', manifestCode, code, 100)),
    hook_codes: hookCodes,
    tool_bindings: toolBindings,
    errors,
    warnings,
    summary: status === 'PASSED'
      ? `Manifest 校验通过，将同步 ${permissions.length} 个权限、${menuCodes.length} 个菜单、${hookCodes.length} 个 Hook、${toolBindings.length} 个工具。`
      : `Manifest 校验失败：${errors.map((issue) => issue.message).join('；')}`,
  };
}

function readSecurityReviewStatus(manifest: Record<string, unknown> | null) {
  if (!manifest) return null;
  const direct = readString(manifest.security_review_status);
  if (direct) return direct.toUpperCase();
  const review = manifest.security_review;
  if (isRecord(review)) {
    return readString(review.status)?.toUpperCase() ?? null;
  }
  return null;
}

function extractManifestCodes(manifest: Record<string, unknown> | null, collectionKeys: string[], codeKeys: string[]) {
  if (!manifest) return [];
  const values: string[] = [];
  for (const key of collectionKeys) {
    const collection = manifest[key];
    if (!Array.isArray(collection)) continue;
    for (const item of collection) {
      if (!isRecord(item)) continue;
      for (const codeKey of codeKeys) {
        const code = readString(item[codeKey]);
        if (code) {
          values.push(code);
          break;
        }
      }
    }
  }
  return Array.from(new Set(values));
}

function readToolPreviews(
  manifest: Record<string, unknown>,
  errors: PluginManifestValidationIssue[],
  warnings: PluginManifestValidationIssue[],
): NormalizedToolPreview[] {
  const collection = readObjectArray(manifest, ['tools', 'actions', 'capabilities']);
  return collection.map((tool, index) => {
    const code = normalizeManifestCode(readFirstString(tool, ['code', 'tool_code']) ?? `tool_${index + 1}`);
    const name = readFirstString(tool, ['name', 'tool_name']) ?? code;
    const method = normalizeToolMethod(readFirstString(tool, ['method']) ?? 'POST');
    const url = normalizeUrl(readFirstString(tool, ['url', 'endpoint']) ?? '');
    const riskLevel = normalizeToolRiskLevel(readFirstString(tool, ['risk_level', 'risk']) ?? null);
    const requireApproval = riskLevel === 'HIGH'
      ? true
      : readBoolean(tool.require_approval ?? tool.requireApproval, false);
    const status = normalizeToolStatus(readFirstString(tool, ['status']) ?? null);

    if (!url) {
      errors.push(buildValidationIssue('TOOL_URL_REQUIRED', 'ERROR', `tools.${index}.url`, `插件工具 ${code} 缺少有效 url。`));
    }
    if (riskLevel === 'HIGH' && !requireApproval) {
      warnings.push(buildValidationIssue('TOOL_APPROVAL_FORCED', 'WARN', `tools.${index}.require_approval`, `高风险插件工具 ${code} 会强制走工具审批。`));
    }

    return {
      code,
      name,
      method,
      url,
      riskLevel,
      requireApproval,
      status,
    };
  });
}

function readPackageMetadata(manifest: Record<string, unknown>) {
  const packageObject = isRecord(manifest.package) ? manifest.package : {};
  return {
    sourceUrl: normalizePackageSource(
      readString(packageObject.source_url)
      ?? readString(packageObject.sourceUrl)
      ?? readString(packageObject.url)
      ?? readString(manifest.package_source)
      ?? readString(manifest.package_url),
    ),
    sha256: readString(packageObject.sha256) ?? readString(packageObject.integrity_sha256) ?? readString(manifest.package_sha256),
    signature: readString(packageObject.signature) ?? readString(packageObject.signature_bundle) ?? readString(manifest.package_signature),
  };
}

function buildValidationIssue(
  code: string,
  severity: PluginManifestValidationIssue['severity'],
  path: string,
  message: string,
): PluginManifestValidationIssue {
  return { code, severity, path, message };
}

function readFirstString(value: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const entry = readString(value[key]);
    if (entry) return entry;
  }
  return null;
}

function readStringArray(manifest: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = manifest[key];
    if (Array.isArray(value)) {
      return value.map((item) => readString(item)).filter((item): item is string => Boolean(item));
    }
  }
  return [];
}

function readObjectArray(manifest: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = manifest[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function normalizeSourceType(value: PluginSourceType | undefined): PluginSourceType {
  return value === 'CUSTOM' ? 'CUSTOM' : 'MARKET';
}

function normalizeVersion(value: string) {
  const trimmed = value.trim();
  return trimmed || '1.0.0';
}

function normalizePluginRiskLevel(value: string | null): PluginRiskLevel {
  const normalized = value?.trim().toUpperCase();
  if (normalized === 'LOW' || normalized === 'MEDIUM' || normalized === 'HIGH' || normalized === 'CRITICAL') return normalized;
  return 'MEDIUM';
}

function normalizeToolRiskLevel(value: string | null): 'LOW' | 'MEDIUM' | 'HIGH' {
  const normalized = value?.trim().toUpperCase();
  if (normalized === 'LOW' || normalized === 'MEDIUM') return normalized;
  return 'HIGH';
}

function normalizeToolMethod(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'GET' || normalized === 'POST' || normalized === 'PUT' || normalized === 'PATCH' || normalized === 'DELETE') {
    return normalized;
  }
  return 'POST';
}

function normalizeToolStatus(value: string | null) {
  const normalized = value?.trim().toUpperCase();
  if (normalized === 'ACTIVE' || normalized === 'DISABLED') return normalized;
  return 'ACTIVE';
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).toString();
  } catch {
    return null;
  }
}

function normalizePackageSource(value: string | null) {
  if (!value) return null;
  if (value.startsWith('s3://') || value.startsWith('minio://')) return value;
  return normalizeUrl(value);
}

function readBoolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

function buildNamespacedCode(prefix: string, namespace: string, rawCode: string, maxLength: number) {
  const parts = [prefix, namespace, rawCode].map((part) => normalizeManifestCode(part)).filter(Boolean);
  const base = parts.join('_');
  return base.slice(0, maxLength);
}

function normalizeManifestCode(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'item';
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
