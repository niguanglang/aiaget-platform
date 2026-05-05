import type { PluginInstallationStatus, PluginRiskLevel } from '@aiaget/shared-types';

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
