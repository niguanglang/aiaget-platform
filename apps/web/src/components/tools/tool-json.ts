export function parseJsonObjectText(
  value: string,
  fieldLabel: string,
  options: { allowEmpty?: boolean } = {},
): { ok: true; value: Record<string, unknown> | null } | { ok: false; message: string } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: true, value: options.allowEmpty ? null : {} };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return { ok: false, message: `${fieldLabel}必须是 JSON 对象。` };
    }

    return { ok: true, value: parsed as Record<string, unknown> };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? `${fieldLabel}解析失败：${error.message}` : `${fieldLabel}解析失败。` };
  }
}

export function parseJsonStringRecordText(
  value: string,
  fieldLabel: string,
  options: { allowEmpty?: boolean } = {},
): { ok: true; value: Record<string, string> | null } | { ok: false; message: string } {
  const parsed = parseJsonObjectText(value, fieldLabel, options);
  if (!parsed.ok) return parsed;
  if (parsed.value === null) {
    return { ok: true, value: null };
  }

  for (const [key, entry] of Object.entries(parsed.value)) {
    if (typeof entry !== 'string') {
      return { ok: false, message: `${fieldLabel}中的 ${key} 必须是字符串。` };
    }
  }

  return { ok: true, value: parsed.value as Record<string, string> };
}

export function createInputDefaultsFromSchema(schema: unknown): Record<string, unknown> {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return {};

  const schemaObject = schema as Record<string, unknown>;
  const type = typeof schemaObject.type === 'string' ? schemaObject.type : undefined;

  if (type === 'object') {
    const properties =
      schemaObject.properties && typeof schemaObject.properties === 'object' && !Array.isArray(schemaObject.properties)
        ? (schemaObject.properties as Record<string, unknown>)
        : {};
    const required = Array.isArray(schemaObject.required)
      ? schemaObject.required.filter((item): item is string => typeof item === 'string')
      : Object.keys(properties);

    return Object.fromEntries(
      required.map((key) => [key, createDefaultValue(properties[key])]),
    );
  }

  return {};
}

export function stringifyJson(value: unknown, fallback = '{}') {
  if (value === undefined || value === null) return fallback;
  return JSON.stringify(value, null, 2);
}

function createDefaultValue(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return '';

  const schemaObject = schema as Record<string, unknown>;
  const type = typeof schemaObject.type === 'string' ? schemaObject.type : undefined;

  if (type === 'number' || type === 'integer') return 0;
  if (type === 'boolean') return false;
  if (type === 'array') return [];
  if (type === 'object') return createInputDefaultsFromSchema(schemaObject);
  if (type === 'null') return null;
  if (Array.isArray(schemaObject.enum) && schemaObject.enum.length > 0) return schemaObject.enum[0];

  return '';
}
