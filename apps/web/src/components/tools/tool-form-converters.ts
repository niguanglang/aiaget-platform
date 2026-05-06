import type { CreateToolInput, UpdateToolInput } from '@aiaget/shared-types';

import { parseJsonObjectText, parseJsonStringRecordText } from '@/components/tools/tool-json';
import type { ToolFormValues } from '@/components/tools/tool-form-panel';

export function toCreateToolInput(
  values: ToolFormValues,
): { ok: true; value: CreateToolInput } | { ok: false; message: string } {
  const headers = parseJsonStringRecordText(values.headers_text, '默认请求头', { allowEmpty: true });
  if (!headers.ok) return headers;

  const authConfig = parseJsonObjectText(values.auth_config_text, '鉴权配置', { allowEmpty: true });
  if (!authConfig.ok) return authConfig;

  const inputSchema = parseJsonObjectText(values.input_schema_text, '输入结构', { allowEmpty: true });
  if (!inputSchema.ok) return inputSchema;

  const outputSchema = parseJsonObjectText(values.output_schema_text, '输出结构', { allowEmpty: true });
  if (!outputSchema.ok) return outputSchema;

  return {
    ok: true,
    value: {
      name: values.name,
      code: values.code,
      description: nullableText(values.description),
      method: values.method,
      url: values.url,
      risk_level: values.risk_level,
      timeout_ms: values.timeout_ms,
      require_approval: values.require_approval,
      auth_type: values.auth_type,
      headers: headers.value,
      auth_config: authConfig.value,
      input_schema: inputSchema.value,
      output_schema: outputSchema.value,
    },
  };
}

export function toUpdateToolInput(
  values: ToolFormValues,
): { ok: true; value: UpdateToolInput } | { ok: false; message: string } {
  const created = toCreateToolInput(values);
  if (!created.ok) return created;

  return {
    ok: true,
    value: {
      ...created.value,
      status: values.status,
    },
  };
}

function nullableText(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
