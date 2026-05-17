type ControlApiBaseUrlOptions = {
  preferRelative?: boolean;
};

export function resolveControlApiBaseUrl(options: ControlApiBaseUrlOptions = {}) {
  if (options.preferRelative || typeof window !== 'undefined') {
    return '/api/v1';
  }

  const internalBaseUrl = normalizeBaseUrl(process.env.CONTROL_API_INTERNAL_BASE_URL);
  if (internalBaseUrl) {
    return appendApiV1Path(internalBaseUrl);
  }

  const publicBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_CONTROL_API_BASE_URL);
  if (publicBaseUrl && /^https?:\/\//.test(publicBaseUrl)) {
    return appendApiV1Path(publicBaseUrl);
  }

  for (const fallbackBaseUrl of ['http://localhost:3001', 'http://127.0.0.1:3001']) {
    const normalizedFallback = normalizeBaseUrl(fallbackBaseUrl);

    if (normalizedFallback) {
      return appendApiV1Path(normalizedFallback);
    }
  }

  return 'http://localhost:3001/api/v1';
}

function normalizeBaseUrl(value: string | undefined) {
  if (!value) return null;

  return value.replace(/\/+$/, '');
}

function appendApiV1Path(baseUrl: string) {
  return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
}
