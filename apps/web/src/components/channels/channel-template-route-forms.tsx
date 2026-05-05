'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useId, useMemo, useState } from 'react';

import type {
  AgentListItem,
  ChannelAccountItem,
  ChannelProviderItem,
  ChannelRouteRuleDirection,
  ChannelRouteRuleOperationStatus,
  ChannelTemplateOperationStatus,
  CreateChannelRouteRuleInput,
  CreateChannelTemplateInput,
  UpdateChannelRouteRuleInput,
} from '@aiaget/shared-types';

import { stringifyJson } from '@/components/tools/tool-json';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type JsonObject = Record<string, unknown>;
type JsonObjectParseResult = { ok: true; value: JsonObject | null } | { ok: false; message: string };

export type ChannelTemplateFormValues = CreateChannelTemplateInput;
export type ChannelRouteRuleFormValues = CreateChannelRouteRuleInput & Pick<UpdateChannelRouteRuleInput, 'clear_agent'>;

export interface ChannelTemplateFormProps {
  initialValue?: Partial<ChannelTemplateFormValues> | null;
  providers: ChannelProviderItem[];
  accounts: ChannelAccountItem[];
  loading?: boolean;
  onSubmit: (values: ChannelTemplateFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export interface ChannelRouteRuleFormProps {
  initialValue?: Partial<ChannelRouteRuleFormValues> | null;
  agents: AgentListItem[];
  providers: ChannelProviderItem[];
  accounts: ChannelAccountItem[];
  loading?: boolean;
  onSubmit: (values: ChannelRouteRuleFormValues) => void | Promise<void>;
  onCancel: () => void;
}

interface TemplateDraft {
  provider_id: string;
  account_id: string;
  code: string;
  name: string;
  template_type: string;
  locale: string;
  subject: string;
  body: string;
  variables_text: string;
  content_schema_text: string;
  external_template_id: string;
  version: string;
  status: ChannelTemplateOperationStatus | '';
}

interface RouteRuleDraft {
  agent_id: string;
  provider_id: string;
  account_id: string;
  code: string;
  name: string;
  priority: string;
  status: ChannelRouteRuleOperationStatus | '';
  direction: ChannelRouteRuleDirection | '';
  match_type: string;
  match_config_text: string;
  target_type: string;
  target_config_text: string;
  clear_agent: boolean;
}

interface CodeOption {
  label: string;
  value: string;
}

const templateStatuses: Array<{ label: string; value: ChannelTemplateOperationStatus }> = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已启用', value: 'ACTIVE' },
  { label: '已停用', value: 'DISABLED' },
  { label: '异常', value: 'ERROR' },
  { label: '已审批', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' },
];

const routeRuleStatuses: Array<{ label: string; value: ChannelRouteRuleOperationStatus }> = [
  { label: '已启用', value: 'ACTIVE' },
  { label: '已停用', value: 'DISABLED' },
  { label: '异常', value: 'ERROR' },
  { label: '草稿', value: 'DRAFT' },
];

const directions: Array<{ label: string; value: ChannelRouteRuleDirection }> = [
  { label: '入站（接收）', value: 'INBOUND' },
  { label: '出站（发送）', value: 'OUTBOUND' },
];

const templateTypes: CodeOption[] = [
  { label: '普通消息', value: 'MESSAGE' },
  { label: '通知模板', value: 'NOTIFICATION' },
  { label: '营销模板', value: 'MARKETING' },
  { label: '审核模板', value: 'APPROVAL' },
];

const matchTypes: CodeOption[] = [
  { label: 'JSON 字段匹配', value: 'JSON' },
  { label: '关键词匹配', value: 'KEYWORD' },
  { label: '请求头匹配', value: 'HEADER' },
  { label: '全部匹配', value: 'ALL' },
];

const targetTypes: CodeOption[] = [
  { label: '智能体', value: 'AGENT' },
  { label: '渠道账号', value: 'ACCOUNT' },
  { label: 'Webhook', value: 'WEBHOOK' },
  { label: '忽略消息', value: 'DROP' },
];

export function ChannelTemplateForm({
  accounts,
  initialValue,
  loading = false,
  onCancel,
  onSubmit,
  providers,
}: ChannelTemplateFormProps) {
  const [draft, setDraft] = useState<TemplateDraft>(() => templateDefaults(initialValue));
  const [errors, setErrors] = useState<Partial<Record<keyof TemplateDraft, string>>>({});
  const isEditing = initialValue != null;
  const accountOptions = useMemo(() => filterAccountsByProvider(accounts, draft.provider_id), [accounts, draft.provider_id]);

  useEffect(() => {
    setDraft(templateDefaults(initialValue));
    setErrors({});
  }, [initialValue]);

  useEffect(() => {
    if (!draft.account_id || accountOptions.some((account) => account.id === draft.account_id)) return;
    setDraft((current) => ({ ...current, account_id: '' }));
  }, [accountOptions, draft.account_id]);

  function setField<TKey extends keyof TemplateDraft>(key: TKey, value: TemplateDraft[TKey]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function setProvider(value: string) {
    setDraft((current) => {
      const keepAccount = current.account_id && filterAccountsByProvider(accounts, value).some((account) => account.id === current.account_id);
      return { ...current, provider_id: value, account_id: keepAccount ? current.account_id : '' };
    });
  }

  function setAccount(value: string) {
    const account = accounts.find((item) => item.id === value);
    setDraft((current) => ({
      ...current,
      account_id: value,
      provider_id: account?.provider_id ?? current.provider_id,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof TemplateDraft, string>> = {};
    if (!isRequiredLength(draft.name, 160)) nextErrors.name = '请输入 1-160 个字符的模板名称。';
    if (!isValidCode(draft.code)) nextErrors.code = '编码需为 3-120 位小写字母开头，可包含数字、下划线或连字符。';
    if (!isWithinMaxLength(draft.template_type, 60)) nextErrors.template_type = '模板类型不能超过 60 个字符。';
    if (!isWithinMaxLength(draft.locale, 30)) nextErrors.locale = '语言/地区不能超过 30 个字符。';
    if (!isWithinMaxLength(draft.subject, 300)) nextErrors.subject = '标题不能超过 300 个字符。';
    if (!isWithinMaxLength(draft.external_template_id, 180)) nextErrors.external_template_id = '外部模板 ID 不能超过 180 个字符。';
    if (!isPositiveInteger(draft.version, 1)) nextErrors.version = '版本号必须是大于等于 1 的整数。';

    const parsedVariables = parseJsonObjectField(draft.variables_text, '变量 JSON');
    const parsedContentSchema = parseJsonObjectField(draft.content_schema_text, '内容结构 JSON');

    if (!parsedVariables.ok) nextErrors.variables_text = parsedVariables.message;
    if (!parsedContentSchema.ok) nextErrors.content_schema_text = parsedContentSchema.message;

    if (Object.keys(nextErrors).length > 0 || !parsedVariables.ok || !parsedContentSchema.ok) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      provider_id: toNullable(draft.provider_id),
      account_id: toNullable(draft.account_id),
      code: draft.code.trim(),
      name: draft.name.trim(),
      template_type: toOptional(draft.template_type),
      locale: toNullable(draft.locale),
      subject: toNullable(draft.subject),
      body: toNullable(draft.body),
      variables: parsedVariables.value,
      content_schema: parsedContentSchema.value,
      external_template_id: toNullable(draft.external_template_id),
      version: isEditing ? undefined : Number.parseInt(draft.version, 10),
      status: draft.status || undefined,
    });
  }

  return (
    <Card className="overflow-hidden">
      <form className="grid gap-5 p-5" onSubmit={handleSubmit}>
        <FormHeader
          description="维护渠道模板的基础信息、正文内容、变量映射和内容结构。"
          title={isEditing ? '编辑渠道模板' : '新建渠道模板'}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="名称" message={errors.name}>
            <Input
              disabled={loading}
              maxLength={160}
              value={draft.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="例如：订单通知模板"
            />
          </Field>
          <Field label="编码" message={errors.code}>
            <Input
              disabled={loading}
              maxLength={120}
              readOnly={isEditing}
              value={draft.code}
              onChange={(event) => setField('code', event.target.value)}
              placeholder="例如：order_notice"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="渠道供应商">
            <select
              className={selectClassName}
              disabled={loading}
              value={draft.provider_id}
              onChange={(event) => setProvider(event.target.value)}
            >
              <option value="">不指定供应商</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {formatProviderOption(provider)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="渠道账号">
            <select
              className={selectClassName}
              disabled={loading}
              value={draft.account_id}
              onChange={(event) => setAccount(event.target.value)}
            >
              <option value="">不指定账号</option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {formatAccountOption(account)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="模板类型" message={errors.template_type}>
            <TextSelect
              disabled={loading}
              maxLength={60}
              options={templateTypes}
              value={draft.template_type}
              onChange={(value) => setField('template_type', value)}
              placeholder="请选择或输入模板类型"
            />
          </Field>
          <Field label="语言/地区" message={errors.locale}>
            <Input
              disabled={loading}
              maxLength={30}
              value={draft.locale}
              onChange={(event) => setField('locale', event.target.value)}
              placeholder="例如：zh-CN"
            />
          </Field>
          <Field label="版本" message={errors.version}>
            <Input
              disabled={loading}
              min={1}
              readOnly={isEditing}
              step={1}
              type="number"
              value={draft.version}
              onChange={(event) => setField('version', event.target.value)}
            />
          </Field>
        </div>

        <Field label="标题" message={errors.subject}>
          <Input
            disabled={loading}
            maxLength={300}
            value={draft.subject}
            onChange={(event) => setField('subject', event.target.value)}
            placeholder="例如：您的订单已发货"
          />
        </Field>

        <Field label="正文内容">
          <textarea
            className={textareaClassName}
            disabled={loading}
            value={draft.body}
            onChange={(event) => setField('body', event.target.value)}
            placeholder="填写模板正文，可包含变量占位符。"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="变量 JSON" message={errors.variables_text}>
            <JsonTextarea
              disabled={loading}
              error={errors.variables_text}
              onChange={(value) => setField('variables_text', value)}
              value={draft.variables_text}
              placeholder={'{\n  "user_name": "张三"\n}'}
            />
          </Field>
          <Field label="内容结构 JSON" message={errors.content_schema_text}>
            <JsonTextarea
              disabled={loading}
              error={errors.content_schema_text}
              onChange={(value) => setField('content_schema_text', value)}
              value={draft.content_schema_text}
              placeholder={'{\n  "type": "object"\n}'}
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="外部模板 ID" message={errors.external_template_id}>
            <Input
              disabled={loading}
              maxLength={180}
              value={draft.external_template_id}
              onChange={(event) => setField('external_template_id', event.target.value)}
              placeholder="第三方平台模板编号"
            />
          </Field>
          <Field label="状态">
            <select
              className={selectClassName}
              disabled={loading}
              value={draft.status}
              onChange={(event) => setField('status', event.target.value as ChannelTemplateOperationStatus | '')}
            >
              <option value="">不指定状态</option>
              {templateStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <FormActions loading={loading} onCancel={onCancel} submitText={isEditing ? '保存修改' : '新建模板'} />
      </form>
    </Card>
  );
}

export function ChannelRouteRuleForm({
  accounts,
  agents,
  initialValue,
  loading = false,
  onCancel,
  onSubmit,
  providers,
}: ChannelRouteRuleFormProps) {
  const [draft, setDraft] = useState<RouteRuleDraft>(() => routeRuleDefaults(initialValue));
  const [errors, setErrors] = useState<Partial<Record<keyof RouteRuleDraft, string>>>({});
  const isEditing = initialValue != null;
  const accountOptions = useMemo(() => filterAccountsByProvider(accounts, draft.provider_id), [accounts, draft.provider_id]);

  useEffect(() => {
    setDraft(routeRuleDefaults(initialValue));
    setErrors({});
  }, [initialValue]);

  useEffect(() => {
    if (!draft.account_id || accountOptions.some((account) => account.id === draft.account_id)) return;
    setDraft((current) => ({ ...current, account_id: '' }));
  }, [accountOptions, draft.account_id]);

  function setField<TKey extends keyof RouteRuleDraft>(key: TKey, value: RouteRuleDraft[TKey]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function setProvider(value: string) {
    setDraft((current) => {
      const keepAccount = current.account_id && filterAccountsByProvider(accounts, value).some((account) => account.id === current.account_id);
      return { ...current, provider_id: value, account_id: keepAccount ? current.account_id : '' };
    });
  }

  function setAccount(value: string) {
    const account = accounts.find((item) => item.id === value);
    setDraft((current) => ({
      ...current,
      account_id: value,
      provider_id: account?.provider_id ?? current.provider_id,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof RouteRuleDraft, string>> = {};
    if (!isRequiredLength(draft.name, 160)) nextErrors.name = '请输入 1-160 个字符的路由规则名称。';
    if (!isValidCode(draft.code)) nextErrors.code = '编码需为 3-120 位小写字母开头，可包含数字、下划线或连字符。';
    if (!isPositiveInteger(draft.priority, 0)) nextErrors.priority = '优先级必须是大于等于 0 的整数。';
    if (!isWithinMaxLength(draft.match_type, 60)) nextErrors.match_type = '匹配类型不能超过 60 个字符。';
    if (!isWithinMaxLength(draft.target_type, 60)) nextErrors.target_type = '目标类型不能超过 60 个字符。';

    const parsedMatchConfig = parseJsonObjectField(draft.match_config_text, '匹配配置 JSON');
    const parsedTargetConfig = parseJsonObjectField(draft.target_config_text, '目标配置 JSON');

    if (!parsedMatchConfig.ok) nextErrors.match_config_text = parsedMatchConfig.message;
    if (!parsedTargetConfig.ok) nextErrors.target_config_text = parsedTargetConfig.message;

    if (Object.keys(nextErrors).length > 0 || !parsedMatchConfig.ok || !parsedTargetConfig.ok) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      agent_id: draft.clear_agent ? null : toNullable(draft.agent_id),
      provider_id: toNullable(draft.provider_id),
      account_id: toNullable(draft.account_id),
      code: draft.code.trim(),
      name: draft.name.trim(),
      priority: Number.parseInt(draft.priority, 10),
      status: draft.status || undefined,
      direction: draft.direction || undefined,
      match_type: toOptional(draft.match_type),
      match_config: parsedMatchConfig.value,
      target_type: toOptional(draft.target_type),
      target_config: parsedTargetConfig.value,
      clear_agent: isEditing ? draft.clear_agent : undefined,
    });
  }

  return (
    <Card className="overflow-hidden">
      <form className="grid gap-5 p-5" onSubmit={handleSubmit}>
        <FormHeader
          description="配置渠道路由的关联对象、匹配条件、优先级和目标投递策略。"
          title={isEditing ? '编辑渠道路由规则' : '新建渠道路由规则'}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="名称" message={errors.name}>
            <Input
              disabled={loading}
              maxLength={160}
              value={draft.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="例如：客服消息入站路由"
            />
          </Field>
          <Field label="编码" message={errors.code}>
            <Input
              disabled={loading}
              maxLength={120}
              readOnly={isEditing}
              value={draft.code}
              onChange={(event) => setField('code', event.target.value)}
              placeholder="例如：customer_service_inbound"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="智能体">
            <select
              className={selectClassName}
              disabled={loading || draft.clear_agent}
              value={draft.agent_id}
              onChange={(event) => setField('agent_id', event.target.value)}
            >
              <option value="">不指定智能体</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {formatAgentOption(agent)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="渠道供应商">
            <select
              className={selectClassName}
              disabled={loading}
              value={draft.provider_id}
              onChange={(event) => setProvider(event.target.value)}
            >
              <option value="">不指定供应商</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {formatProviderOption(provider)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="渠道账号">
            <select
              className={selectClassName}
              disabled={loading}
              value={draft.account_id}
              onChange={(event) => setAccount(event.target.value)}
            >
              <option value="">不指定账号</option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {formatAccountOption(account)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="优先级" message={errors.priority}>
            <Input
              disabled={loading}
              min={0}
              step={1}
              type="number"
              value={draft.priority}
              onChange={(event) => setField('priority', event.target.value)}
            />
          </Field>
          <Field label="方向">
            <select
              className={selectClassName}
              disabled={loading}
              value={draft.direction}
              onChange={(event) => setField('direction', event.target.value as ChannelRouteRuleDirection | '')}
            >
              <option value="">不指定方向</option>
              {directions.map((direction) => (
                <option key={direction.value} value={direction.value}>
                  {direction.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="状态">
            <select
              className={selectClassName}
              disabled={loading}
              value={draft.status}
              onChange={(event) => setField('status', event.target.value as ChannelRouteRuleOperationStatus | '')}
            >
              <option value="">不指定状态</option>
              {routeRuleStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="匹配类型" message={errors.match_type}>
            <TextSelect
              disabled={loading}
              maxLength={60}
              options={matchTypes}
              value={draft.match_type}
              onChange={(value) => setField('match_type', value)}
              placeholder="请选择或输入匹配类型"
            />
          </Field>
          <Field label="目标类型" message={errors.target_type}>
            <TextSelect
              disabled={loading}
              maxLength={60}
              options={targetTypes}
              value={draft.target_type}
              onChange={(value) => setField('target_type', value)}
              placeholder="请选择或输入目标类型"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="匹配配置 JSON" message={errors.match_config_text}>
            <JsonTextarea
              disabled={loading}
              error={errors.match_config_text}
              onChange={(value) => setField('match_config_text', value)}
              value={draft.match_config_text}
              placeholder={'{\n  "keyword": "退款"\n}'}
            />
          </Field>
          <Field label="目标配置 JSON" message={errors.target_config_text}>
            <JsonTextarea
              disabled={loading}
              error={errors.target_config_text}
              onChange={(value) => setField('target_config_text', value)}
              value={draft.target_config_text}
              placeholder={'{\n  "agent_id": "目标智能体 ID"\n}'}
            />
          </Field>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            checked={draft.clear_agent}
            disabled={loading || !isEditing}
            type="checkbox"
            onChange={(event) => setField('clear_agent', event.target.checked)}
          />
          <span>清空智能体绑定</span>
        </label>

        <FormActions loading={loading} onCancel={onCancel} submitText={isEditing ? '保存修改' : '新建规则'} />
      </form>
    </Card>
  );
}

function templateDefaults(value?: Partial<ChannelTemplateFormValues> | null): TemplateDraft {
  return {
    provider_id: value?.provider_id ?? '',
    account_id: value?.account_id ?? '',
    code: value?.code ?? '',
    name: value?.name ?? '',
    template_type: value?.template_type ?? 'MESSAGE',
    locale: value?.locale ?? 'zh-CN',
    subject: value?.subject ?? '',
    body: value?.body ?? '',
    variables_text: stringifyJson(value?.variables, ''),
    content_schema_text: stringifyJson(value?.content_schema, ''),
    external_template_id: value?.external_template_id ?? '',
    version: value?.version !== undefined && value?.version !== null ? `${value.version}` : '1',
    status: value?.status ?? '',
  };
}

function routeRuleDefaults(value?: Partial<ChannelRouteRuleFormValues> | null): RouteRuleDraft {
  return {
    agent_id: value?.clear_agent ? '' : value?.agent_id ?? '',
    provider_id: value?.provider_id ?? '',
    account_id: value?.account_id ?? '',
    code: value?.code ?? '',
    name: value?.name ?? '',
    priority: value?.priority !== undefined && value?.priority !== null ? `${value.priority}` : '100',
    status: value?.status ?? '',
    direction: value?.direction ?? 'INBOUND',
    match_type: value?.match_type ?? 'JSON',
    match_config_text: stringifyJson(value?.match_config, ''),
    target_type: value?.target_type ?? 'AGENT',
    target_config_text: stringifyJson(value?.target_config, ''),
    clear_agent: value?.clear_agent ?? false,
  };
}

function filterAccountsByProvider(accounts: ChannelAccountItem[], providerId: string) {
  if (!providerId) return accounts;
  return accounts.filter((account) => account.provider_id === providerId);
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

function isValidCode(value: string) {
  return /^[a-z][a-z0-9_-]{2,119}$/.test(value.trim());
}

function isPositiveInteger(value: string, min: number) {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return false;
  return Number.parseInt(trimmed, 10) >= min;
}

function isRequiredLength(value: string, maxLength: number) {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
}

function isWithinMaxLength(value: string, maxLength: number) {
  return value.trim().length <= maxLength;
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatProviderOption(provider: ChannelProviderItem) {
  const name = provider.name.trim();
  const code = provider.code.trim();
  if (name && code) return `${name}（${code}）`;
  return name || code || provider.id;
}

function formatAccountOption(account: ChannelAccountItem) {
  const name = account.account_name.trim();
  const provider = account.provider_name?.trim() || account.provider_code?.trim();
  if (provider && name) return `${name} · ${provider}`;
  return name || provider || account.id;
}

function formatAgentOption(agent: AgentListItem) {
  const name = agent.name.trim();
  const code = agent.code.trim();
  if (name && code) return `${name}（${code}）`;
  return name || code || agent.id;
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

function FormHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="border-b pb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FormActions({
  loading,
  onCancel,
  submitText,
}: {
  loading: boolean;
  onCancel: () => void;
  submitText: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t pt-4">
      <Button disabled={loading} type="button" variant="outline" onClick={onCancel}>
        取消
      </Button>
      <Button disabled={loading} type="submit">
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

function JsonTextarea({
  disabled,
  error,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <textarea
      aria-invalid={error ? true : undefined}
      className={cn(jsonTextareaClassName, error ? 'border-destructive bg-destructive/5 focus-visible:ring-destructive/40' : '')}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder ?? '{\n  "key": "value"\n}'}
      spellCheck={false}
      value={value}
    />
  );
}

const selectClassName =
  'h-10 rounded-md border bg-background/80 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70';

const textareaClassName =
  'min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70';

const jsonTextareaClassName =
  'min-h-36 resize-y rounded-md border bg-background/80 px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70';
