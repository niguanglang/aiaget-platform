import type { ChannelProviderItem, CreateChannelProviderInput, UpdateChannelProviderInput } from '@aiaget/shared-types';

import type { ChannelProviderFormValues } from '@/components/channels/channel-provider-account-forms';

export function normalizeProviderFormValues(values: ChannelProviderFormValues): CreateChannelProviderInput {
  return {
    auth_type: normalizeNullableString(values.auth_type),
    callback_url: normalizeNullableString(values.callback_url),
    capabilities: values.capabilities ?? [],
    code: values.code.trim(),
    config: values.config ?? null,
    description: normalizeNullableString(values.description),
    endpoint_url: normalizeNullableString(values.endpoint_url),
    name: values.name.trim(),
    provider_type: values.provider_type?.trim() || undefined,
    status: values.status,
  };
}

export function toUpdateChannelProviderInput(input: CreateChannelProviderInput): UpdateChannelProviderInput {
  return {
    auth_type: input.auth_type,
    callback_url: input.callback_url,
    capabilities: input.capabilities,
    config: input.config,
    description: input.description,
    endpoint_url: input.endpoint_url,
    name: input.name,
    provider_type: input.provider_type,
    status: input.status,
  };
}

export function providerToFormValues(item: ChannelProviderItem): Partial<ChannelProviderFormValues> {
  const metadata = item.metadata ?? {};

  return {
    auth_type: getMetadataString(metadata, 'auth_type'),
    callback_url: getMetadataString(metadata, 'callback_url'),
    capabilities: getMetadataStringArray(metadata, 'capabilities'),
    code: item.code,
    config: getMetadataRecord(metadata, 'config'),
    description: getMetadataString(metadata, 'description'),
    endpoint_url: getMetadataString(metadata, 'endpoint_url'),
    name: item.name,
    provider_type: getMetadataString(metadata, 'provider_type') ?? item.type,
    status: item.status as ChannelProviderFormValues['status'],
  };
}

function normalizeNullableString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'string' ? value : null;
}

function getMetadataStringArray(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getMetadataRecord(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
