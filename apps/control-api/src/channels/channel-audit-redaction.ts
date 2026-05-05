const REDACTED = '[REDACTED]';

const SENSITIVE_KEY_PARTS = [
  'authorization',
  'cookie',
  'token',
  'secret',
  'signature',
  'signing',
  'access_key',
  'api_key',
  'apikey',
  'corpsecret',
];

const SENSITIVE_QUERY_KEYS = new Set([
  'access_token',
  'api_key',
  'apikey',
  'authorization',
  'auth',
  'client_secret',
  'code',
  'corpsecret',
  'key',
  'msg_signature',
  'secret',
  'sign',
  'signature',
  'sig',
  'token',
]);

export function redactChannelAuditUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    for (const key of Array.from(url.searchParams.keys())) {
      if (isSensitiveKey(key) || SENSITIVE_QUERY_KEYS.has(normalizeKey(key))) {
        url.searchParams.set(key, REDACTED);
      }
    }

    return url.toString();
  } catch {
    return redactSensitiveString(value);
  }
}

export function redactChannelAuditValue(value: unknown): unknown {
  return redactValue(value, null);
}

export function redactChannelAuditHeaders(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, isSensitiveKey(key) ? REDACTED : redactSensitiveString(value)]),
  );
}

export function redactChannelAuditText(value: string | null | undefined) {
  if (!value) return value ?? null;
  const parsed = parseMaybeJson(value);
  if (parsed !== null) {
    return JSON.stringify(redactChannelAuditValue(parsed));
  }

  return redactSensitiveString(value);
}

function redactValue(value: unknown, key: string | null): unknown {
  if (key && isSensitiveKey(key)) return REDACTED;
  if (typeof value === 'string') return redactSensitiveString(value);
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => redactValue(item, null));

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
      entryKey,
      redactValue(entryValue, entryKey),
    ]),
  );
}

function redactSensitiveString(value: string) {
  const urlRedacted = redactUrlsInsideString(value);

  return urlRedacted
    .replace(/\b(Bearer|Basic)\s+[^\s,;]+/gi, `$1 ${REDACTED}`)
    .replace(/((?:access_token|api_key|apikey|authorization|client_secret|cookie|corpsecret|msg_signature|secret|sign|signature|sig|token)=)[^\s&#,;]+/gi, `$1${REDACTED}`);
}

function redactUrlsInsideString(value: string) {
  return value.replace(/https?:\/\/[^\s"'<>]+/gi, (match) => {
    try {
      const url = new URL(match);
      for (const key of Array.from(url.searchParams.keys())) {
        if (isSensitiveKey(key) || SENSITIVE_QUERY_KEYS.has(normalizeKey(key))) {
          url.searchParams.set(key, REDACTED);
        }
      }

      return url.toString();
    } catch {
      return match;
    }
  });
}

function parseMaybeJson(value: string) {
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return null;

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

function isSensitiveKey(key: string) {
  const normalized = normalizeKey(key);
  if (SENSITIVE_QUERY_KEYS.has(normalized)) return true;
  if (normalized === 'set_cookie' || normalized === 'x_api_key') return true;

  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replaceAll('-', '_');
}
