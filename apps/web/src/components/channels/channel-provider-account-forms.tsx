'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useId, useMemo, useState } from 'react';

import type {
  ChannelAccountOperationStatus,
  ChannelProviderOperationStatus,
  CreateChannelAccountInput,
  CreateChannelProviderInput,
} from '@aiaget/shared-types';

import { stringifyJson } from '@/components/tools/tool-json';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type JsonObject = Record<string, unknown>;
type JsonObjectParseResult = { ok: true; value: JsonObject | null } | { ok: false; message: string };

export type ChannelProviderFormValues = CreateChannelProviderInput;
export type ChannelAccountFormValues = CreateChannelAccountInput;

export interface ChannelProviderOption {
  id: string;
  code?: string | null;
  name?: string | null;
}

export interface ChannelProviderFormProps {
  initialValue?: Partial<ChannelProviderFormValues> | null;
  providers?: ChannelProviderOption[];
  loading?: boolean;
  onSubmit: (values: ChannelProviderFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export interface ChannelAccountFormProps {
  initialValue?: Partial<ChannelAccountFormValues> | null;
  providers: ChannelProviderOption[];
  loading?: boolean;
  onSubmit: (values: ChannelAccountFormValues) => void | Promise<void>;
  onCancel: () => void;
}

interface ProviderDraft {
  name: string;
  code: string;
  provider_type: string;
  endpoint_url: string;
  callback_url: string;
  capabilities_text: string;
  auth_type: string;
  config_text: string;
  description: string;
  status: ChannelProviderOperationStatus;
}

interface AccountDraft {
  provider_id: string;
  code: string;
  name: string;
  external_account_id: string;
  secret: string;
  config_text: string;
  description: string;
  status: ChannelAccountOperationStatus;
}

interface CodeOption {
  label: string;
  value: string;
}

const providerStatuses: Array<{ label: string; value: ChannelProviderOperationStatus }> = [
  { label: '已启用', value: 'ACTIVE' },
  { label: '已停用', value: 'DISABLED' },
  { label: '异常', value: 'ERROR' },
  { label: '草稿', value: 'DRAFT' },
];

const accountStatuses: Array<{ label: string; value: ChannelAccountOperationStatus }> = [
  { label: '已启用', value: 'ACTIVE' },
  { label: '已停用', value: 'DISABLED' },
  { label: '异常', value: 'ERROR' },
  { label: '已过期', value: 'EXPIRED' },
];

const providerTypes: CodeOption[] = [
  { label: '自定义渠道', value: 'CUSTOM' },
  { label: '企业微信', value: 'WECHAT_WORK' },
  { label: '钉钉', value: 'DINGTALK' },
  { label: '飞书', value: 'FEISHU' },
  { label: 'Slack', value: 'SLACK' },
  { label: '自定义 Webhook', value: 'CUSTOM_WEBHOOK' },
  { label: '邮件', value: 'EMAIL' },
  { label: '短信', value: 'SMS' },
];

const authTypes: CodeOption[] = [
  { label: '无需鉴权', value: 'NONE' },
  { label: '令牌鉴权', value: 'TOKEN' },
  { label: '基础鉴权', value: 'BASIC' },
  { label: 'OAuth2 鉴权', value: 'OAUTH2' },
  { label: '签名鉴权', value: 'SIGNATURE' },
];

export function ChannelProviderForm({
  initialValue,
  loading = false,
  onCancel,
  onSubmit,
}: ChannelProviderFormProps) {
  const [draft, setDraft] = useState<ProviderDraft>(() => providerDefaults(initialValue));
  const [errors, setErrors] = useState<Partial<Record<keyof ProviderDraft, string>>>({});
  const isEditing = initialValue != null;

  useEffect(() => {
    setDraft(providerDefaults(initialValue));
    setErrors({});
  }, [initialValue]);

  function setField<TKey extends keyof ProviderDraft>(key: TKey, value: ProviderDraft[TKey]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof ProviderDraft, string>> = {};
    if (!isRequiredLength(draft.name, 160)) nextErrors.name = '请输入 1-160 个字符的提供方名称。';
    if (!isValidCode(draft.code)) nextErrors.code = '编码需为 3-100 位小写字母开头，可包含数字、下划线或连字符。';
    if (!isWithinMaxLength(draft.provider_type, 60)) nextErrors.provider_type = '提供方类型不能超过 60 个字符。';
    if (!isWithinMaxLength(draft.endpoint_url, 1000)) nextErrors.endpoint_url = '端点地址不能超过 1000 个字符。';
    if (!isWithinMaxLength(draft.callback_url, 1000)) nextErrors.callback_url = '回调地址不能超过 1000 个字符。';
    if (!isWithinMaxLength(draft.auth_type, 60)) nextErrors.auth_type = '鉴权方式不能超过 60 个字符。';

    const parsedConfig = parseJsonObjectField(draft.config_text, '配置 JSON');
    if (!parsedConfig.ok) nextErrors.config_text = parsedConfig.message;

    if (Object.keys(nextErrors).length > 0 || !parsedConfig.ok) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      name: draft.name.trim(),
      code: draft.code.trim(),
      provider_type: draft.provider_type.trim() || undefined,
      endpoint_url: toNullable(draft.endpoint_url),
      callback_url: toNullable(draft.callback_url),
      capabilities: parseCapabilities(draft.capabilities_text),
      auth_type: toNullable(draft.auth_type),
      config: parsedConfig.value,
      description: toNullable(draft.description),
      status: draft.status,
    });
  }

  return (
    <Card className="overflow-hidden">
      <form className="grid gap-5 p-5" onSubmit={handleSubmit}>
        <FormHeader
          title={isEditing ? '编辑渠道提供方' : '创建渠道提供方'}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="名称" message={errors.name}>
            <Input
              disabled={loading}
              maxLength={160}
              value={draft.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="例如：企业微信"
            />
          </Field>
          <Field label="编码" message={errors.code}>
            <Input
              disabled={loading}
              maxLength={100}
              readOnly={isEditing}
              value={draft.code}
              onChange={(event) => setField('code', event.target.value)}
              placeholder="例如：wecom"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="提供方类型" message={errors.provider_type}>
            <TextSelect
              disabled={loading}
              maxLength={60}
              options={providerTypes}
              value={draft.provider_type}
              onChange={(value) => setField('provider_type', value)}
              placeholder="请选择或输入提供方类型"
            />
          </Field>
          <Field label="状态">
            <select
              className={selectClassName}
              disabled={loading}
              value={draft.status}
              onChange={(event) => setField('status', event.target.value as ChannelProviderOperationStatus)}
            >
              {providerStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="端点地址" message={errors.endpoint_url}>
            <Input
              disabled={loading}
              maxLength={1000}
              value={draft.endpoint_url}
              onChange={(event) => setField('endpoint_url', event.target.value)}
              placeholder="例如：https://api.example.com"
            />
          </Field>
          <Field label="回调地址" message={errors.callback_url}>
            <Input
              disabled={loading}
              maxLength={1000}
              value={draft.callback_url}
              onChange={(event) => setField('callback_url', event.target.value)}
              placeholder="例如：https://example.com/channel/callback"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="能力列表">
            <Input
              disabled={loading}
              value={draft.capabilities_text}
              onChange={(event) => setField('capabilities_text', event.target.value)}
              placeholder="例如：消息发送、模板消息、自动回复，可用逗号分隔"
            />
          </Field>
          <Field label="鉴权方式" message={errors.auth_type}>
            <TextSelect
              disabled={loading}
              maxLength={60}
              options={authTypes}
              value={draft.auth_type}
              onChange={(value) => setField('auth_type', value)}
              placeholder="请选择或输入鉴权方式"
            />
          </Field>
        </div>

        <Field label="配置 JSON" message={errors.config_text}>
          <JsonTextarea
            disabled={loading}
            error={errors.config_text}
            value={draft.config_text}
            onChange={(value) => setField('config_text', value)}
          />
        </Field>

        <Field label="描述">
          <textarea
            className={textareaClassName}
            disabled={loading}
            value={draft.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="补充渠道提供方说明"
          />
        </Field>

        <FormActions loading={loading} onCancel={onCancel} submitText={isEditing ? '保存提供方' : '创建提供方'} />
      </form>
    </Card>
  );
}

export function ChannelAccountForm({
  initialValue,
  loading = false,
  onCancel,
  onSubmit,
  providers,
}: ChannelAccountFormProps) {
  const fallbackProviderId = providers[0]?.id ?? '';
  const initialDraft = useMemo(() => accountDefaults(initialValue, fallbackProviderId), [fallbackProviderId, initialValue]);
  const [draft, setDraft] = useState<AccountDraft>(initialDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof AccountDraft, string>>>({});
  const isEditing = initialValue != null;

  useEffect(() => {
    setDraft(initialDraft);
    setErrors({});
  }, [initialDraft]);

  function setField<TKey extends keyof AccountDraft>(key: TKey, value: AccountDraft[TKey]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof AccountDraft, string>> = {};
    if (!draft.provider_id.trim()) nextErrors.provider_id = '请选择渠道提供方。';
    if (!isRequiredLength(draft.name, 160)) nextErrors.name = '请输入 1-160 个字符的账号名称。';
    if (!isValidCode(draft.code)) nextErrors.code = '编码需为 3-100 位小写字母开头，可包含数字、下划线或连字符。';
    if (!isWithinMaxLength(draft.external_account_id, 180)) nextErrors.external_account_id = '外部账号 ID 不能超过 180 个字符。';

    const parsedConfig = parseJsonObjectField(draft.config_text, '配置 JSON');
    if (!parsedConfig.ok) nextErrors.config_text = parsedConfig.message;

    if (Object.keys(nextErrors).length > 0 || !parsedConfig.ok) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      provider_id: draft.provider_id,
      code: draft.code.trim(),
      name: draft.name.trim(),
      external_account_id: toNullable(draft.external_account_id),
      secret: toNullable(draft.secret),
      config: parsedConfig.value,
      description: toNullable(draft.description),
      status: draft.status,
    });
  }

  return (
    <Card className="overflow-hidden">
      <form className="grid gap-5 p-5" onSubmit={handleSubmit}>
        <FormHeader
          title={isEditing ? '编辑渠道账号' : '创建渠道账号'}
        />

        <Field label="渠道提供方" message={errors.provider_id}>
          <select
            className={selectClassName}
            disabled={loading || isEditing || providers.length === 0}
            value={draft.provider_id}
            onChange={(event) => setField('provider_id', event.target.value)}
          >
            {providers.length === 0 ? <option value="">暂无可选提供方</option> : null}
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {formatProviderOption(provider)}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="名称" message={errors.name}>
            <Input
              disabled={loading}
              maxLength={160}
              value={draft.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="例如：默认生产账号"
            />
          </Field>
          <Field label="编码" message={errors.code}>
            <Input
              disabled={loading}
              maxLength={100}
              readOnly={isEditing}
              value={draft.code}
              onChange={(event) => setField('code', event.target.value)}
              placeholder="例如：default_prod"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="外部账号 ID" message={errors.external_account_id}>
            <Input
              disabled={loading}
              maxLength={180}
              value={draft.external_account_id}
              onChange={(event) => setField('external_account_id', event.target.value)}
              placeholder="例如：企业 ID 或应用 ID"
            />
          </Field>
          <Field label="状态">
            <select
              className={selectClassName}
              disabled={loading}
              value={draft.status}
              onChange={(event) => setField('status', event.target.value as ChannelAccountOperationStatus)}
            >
              {accountStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="账号密钥">
          <Input
            autoComplete="new-password"
            disabled={loading}
            type="password"
            value={draft.secret}
            onChange={(event) => setField('secret', event.target.value)}
            placeholder={isEditing ? '留空表示不修改密钥' : '请输入账号密钥'}
          />
        </Field>

        <Field label="配置 JSON" message={errors.config_text}>
          <JsonTextarea
            disabled={loading}
            error={errors.config_text}
            value={draft.config_text}
            onChange={(value) => setField('config_text', value)}
          />
        </Field>

        <Field label="描述">
          <textarea
            className={textareaClassName}
            disabled={loading}
            value={draft.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="补充账号说明"
          />
        </Field>

        <FormActions
          disabled={!isEditing && providers.length === 0}
          loading={loading}
          onCancel={onCancel}
          submitText={isEditing ? '保存账号' : '创建账号'}
        />
      </form>
    </Card>
  );
}

function providerDefaults(value?: Partial<ChannelProviderFormValues> | null): ProviderDraft {
  return {
    name: value?.name ?? '',
    code: value?.code ?? '',
    provider_type: value?.provider_type ?? 'CUSTOM',
    endpoint_url: value?.endpoint_url ?? '',
    callback_url: value?.callback_url ?? '',
    capabilities_text: (value?.capabilities ?? []).join(', '),
    auth_type: value?.auth_type ?? 'NONE',
    config_text: stringifyJson(value?.config, ''),
    description: value?.description ?? '',
    status: value?.status ?? 'ACTIVE',
  };
}

function accountDefaults(value: Partial<ChannelAccountFormValues> | null | undefined, fallbackProviderId: string): AccountDraft {
  return {
    provider_id: value?.provider_id ?? fallbackProviderId,
    code: value?.code ?? '',
    name: value?.name ?? '',
    external_account_id: value?.external_account_id ?? '',
    secret: value?.secret ?? '',
    config_text: stringifyJson(value?.config, ''),
    description: value?.description ?? '',
    status: value?.status ?? 'ACTIVE',
  };
}

function parseCapabilities(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonObjectField(value: string, fieldLabel: string): JsonObjectParseResult {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return { ok: false, message: `${fieldLabel}必须是 JSON 对象，不能填写数组、字符串、数字或 null。` };
    }

    return { ok: true, value: parsed as JsonObject };
  } catch (error) {
    const location = getJsonErrorLocation(trimmed, error);
    const detail = error instanceof Error && error.message ? ` 解析器提示：${error.message}` : '';
    return {
      ok: false,
      message: `${fieldLabel}解析失败${location}。请检查键名和字符串是否使用双引号、逗号是否多余、括号是否闭合。${detail}`,
    };
  }
}

function getJsonErrorLocation(source: string, error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const lineColumnMatch = message.match(/line (\d+) column (\d+)/i);
  const matchedLine = lineColumnMatch?.[1];
  const matchedColumn = lineColumnMatch?.[2];
  if (matchedLine && matchedColumn) return `（第 ${matchedLine} 行，第 ${matchedColumn} 列）`;

  const positionMatch = message.match(/position (\d+)/i);
  const matchedPosition = positionMatch?.[1];
  if (!matchedPosition) return '';

  const position = Number.parseInt(matchedPosition, 10);
  if (!Number.isFinite(position)) return '';

  const { column, line } = getLineColumn(source, position);
  return `（第 ${line} 行，第 ${column} 列）`;
}

function getLineColumn(source: string, position: number) {
  let line = 1;
  let column = 1;

  for (let index = 0; index < position && index < source.length; index += 1) {
    if (source[index] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { column, line };
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isValidCode(value: string) {
  return /^[a-z][a-z0-9_-]{2,99}$/.test(value.trim());
}

function isRequiredLength(value: string, maxLength: number) {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
}

function isWithinMaxLength(value: string, maxLength: number) {
  return value.trim().length <= maxLength;
}

function formatProviderOption(provider: ChannelProviderOption) {
  const name = provider.name?.trim();
  const code = provider.code?.trim();
  if (name && code) return `${name}（${code}）`;
  return name || code || provider.id;
}

function TextSelect({
  disabled = false,
  maxLength,
  onChange,
  options,
  placeholder = '请选择或输入自定义值',
  value,
}: {
  disabled?: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
  options: CodeOption[];
  placeholder?: string;
  value: string;
}) {
  const listId = useId();

  return (
    <>
      <Input
        disabled={disabled}
        list={listId}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} label={option.label} value={option.value} />
        ))}
      </datalist>
    </>
  );
}

function JsonTextarea({
  disabled,
  error,
  onChange,
  value,
}: {
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <textarea
      aria-invalid={error ? true : undefined}
      className={cn(jsonTextareaClassName, error ? 'border-destructive bg-destructive/5 focus-visible:ring-destructive/40' : '')}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={'{\n  "key": "value"\n}'}
      spellCheck={false}
    />
  );
}

function FormHeader({ title }: { description?: string; title: string }) {
  return (
    <div className="border-b pb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function FormActions({
  disabled = false,
  loading,
  onCancel,
  submitText,
}: {
  disabled?: boolean;
  loading: boolean;
  onCancel: () => void;
  submitText: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t pt-4">
      <Button disabled={loading} type="button" variant="outline" onClick={onCancel}>
        取消
      </Button>
      <Button disabled={loading || disabled} type="submit">
        {loading ? '提交中...' : submitText}
      </Button>
    </div>
  );
}

function Field({
  children,
  label,
  message,
}: {
  children: ReactNode;
  label: string;
  message?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {message ? (
        <span className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs font-normal leading-5 text-destructive" role="alert">
          {message}
        </span>
      ) : null}
    </label>
  );
}

const selectClassName =
  'h-10 rounded-md border bg-background/80 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70';

const textareaClassName =
  'min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70';

const jsonTextareaClassName =
  'min-h-36 resize-y rounded-md border bg-background/80 px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70';
