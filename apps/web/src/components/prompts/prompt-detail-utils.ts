import type {
  PromptTemplateDetail,
  PromptVariableItem,
} from '@aiaget/shared-types';

import type { PromptVariableFormValues } from './prompt-variable-form-panel';

export function toVariableInput(values: PromptVariableFormValues) {
  return {
    name: values.name,
    variable_type: values.variable_type,
    default_value: nullableText(values.default_value),
    required: values.required,
    description: nullableText(values.description),
    sort_order: values.sort_order,
  };
}

function nullableText(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function parseJsonObject(value: string):
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; message: string } {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return { ok: false, message: '输入必须是 JSON 对象。' };
    }

    return { ok: true, value: parsed as Record<string, unknown> };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : '无效的 JSON 输入。',
    };
  }
}

export function createInputDefaults(prompt: PromptTemplateDetail) {
  return Object.fromEntries(
    prompt.variables.map((variable) => [variable.name, coerceVariableDefault(variable.default_value, variable.variable_type)]),
  );
}

function coerceVariableDefault(value: string | null, type: PromptVariableItem['variable_type']) {
  if (value === null || value === '') {
    if (type === 'number') return 0;
    if (type === 'boolean') return false;
    if (type === 'json') return {};
    return '';
  }

  if (type === 'number') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (type === 'boolean') {
    return value === 'true';
  }

  if (type === 'json') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  return value;
}
