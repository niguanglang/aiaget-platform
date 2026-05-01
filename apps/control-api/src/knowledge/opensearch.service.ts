import { Injectable } from '@nestjs/common';

const DEFAULT_INDEX_PREFIX = 'aiaget_knowledge_segments';
const REQUEST_TIMEOUT_MS = 3000;

export interface OpenSearchSegmentDocument {
  id: string;
  tenantId: string;
  knowledgeId: string;
  documentId: string;
  title: string;
  sourceType: string;
  content: string;
  keywords: string[];
  tokenCount: number;
  sortOrder: number;
  storagePath: string | null;
}

export interface OpenSearchWriteResult {
  backend: 'OPENSEARCH' | 'POSTGRES_FALLBACK';
  index: string | null;
  indexed_count: number;
  error_message: string | null;
}

export interface OpenSearchSearchResult {
  backend: 'OPENSEARCH' | 'POSTGRES_FALLBACK';
  index: string | null;
  error_message: string | null;
  scores: Map<string, number>;
}

@Injectable()
export class OpenSearchService {
  private readonly baseUrl = trimTrailingSlash(requireEnv('OPENSEARCH_URL'));
  private readonly username = process.env.OPENSEARCH_USERNAME?.trim() || null;
  private readonly password = process.env.OPENSEARCH_PASSWORD?.trim() || null;
  private readonly indexPrefix = sanitizeIndexName(process.env.OPENSEARCH_INDEX_PREFIX ?? DEFAULT_INDEX_PREFIX);
  private readonly enabled = process.env.OPENSEARCH_ENABLED !== 'false' && Boolean(this.baseUrl);
  private readonly indexCache = new Set<string>();

  async indexSegments(documents: OpenSearchSegmentDocument[]): Promise<OpenSearchWriteResult> {
    const index = this.indexName();

    if (!this.enabled || documents.length === 0) {
      return {
        backend: 'POSTGRES_FALLBACK',
        index,
        indexed_count: 0,
        error_message: 'OpenSearch is not enabled or no document payload is available',
      };
    }

    try {
      await this.ensureIndex(index);
      const body = documents
        .flatMap((document) => [
          JSON.stringify({ index: { _id: document.id, _index: index } }),
          JSON.stringify({
            content: document.content,
            document_id: document.documentId,
            id: document.id,
            keywords: document.keywords,
            knowledge_id: document.knowledgeId,
            sort_order: document.sortOrder,
            source_type: document.sourceType,
            storage_path: document.storagePath,
            tenant_id: document.tenantId,
            title: document.title,
            token_count: document.tokenCount,
            updated_at: new Date().toISOString(),
          }),
        ])
        .join('\n');
      const response = await this.request<{ errors?: boolean; items?: unknown[] }>('/_bulk', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-ndjson',
        },
        body: `${body}\n`,
      });

      if (response.errors) {
        return {
          backend: 'POSTGRES_FALLBACK',
          index,
          indexed_count: 0,
          error_message: extractBulkError(response.items),
        };
      }

      return {
        backend: 'OPENSEARCH',
        index,
        indexed_count: documents.length,
        error_message: null,
      };
    } catch (error) {
      return {
        backend: 'POSTGRES_FALLBACK',
        index,
        indexed_count: 0,
        error_message: errorMessage(error),
      };
    }
  }

  async deleteDocumentSegments(input: {
    tenantId: string;
    knowledgeId: string;
    documentId: string;
  }): Promise<OpenSearchWriteResult> {
    const index = this.indexName();

    if (!this.enabled) {
      return {
        backend: 'POSTGRES_FALLBACK',
        index,
        indexed_count: 0,
        error_message: 'OpenSearch is not enabled',
      };
    }

    try {
      await this.ensureIndex(index);
      const response = await this.request<{ deleted?: number }>(`/${index}/_delete_by_query?refresh=true`, {
        method: 'POST',
        body: JSON.stringify({
          query: {
            bool: {
              filter: [
                termQuery('tenant_id', input.tenantId),
                termQuery('knowledge_id', input.knowledgeId),
                termQuery('document_id', input.documentId),
              ],
            },
          },
        }),
      });

      return {
        backend: 'OPENSEARCH',
        index,
        indexed_count: response.deleted ?? 0,
        error_message: null,
      };
    } catch (error) {
      return {
        backend: 'POSTGRES_FALLBACK',
        index,
        indexed_count: 0,
        error_message: errorMessage(error),
      };
    }
  }

  async searchSegments(input: {
    tenantId: string;
    knowledgeId: string;
    limit: number;
    query: string;
  }): Promise<OpenSearchSearchResult> {
    const index = this.indexName();

    if (!this.enabled || !input.query.trim()) {
      return {
        backend: 'POSTGRES_FALLBACK',
        index,
        error_message: 'OpenSearch is not enabled or query is empty',
        scores: new Map(),
      };
    }

    try {
      await this.ensureIndex(index);
      const response = await this.request<{ hits?: unknown }>(`/${index}/_search`, {
        method: 'POST',
        body: JSON.stringify({
          query: {
            bool: {
              filter: [
                termQuery('tenant_id', input.tenantId),
                termQuery('knowledge_id', input.knowledgeId),
              ],
              minimum_should_match: 1,
              should: [
                {
                  multi_match: {
                    fields: ['title^3', 'content^2', 'keywords^2'],
                    fuzziness: 'AUTO',
                    query: input.query,
                    type: 'best_fields',
                  },
                },
                {
                  match_phrase: {
                    content: {
                      boost: 3,
                      query: input.query,
                    },
                  },
                },
              ],
            },
          },
          size: Math.max(1, input.limit),
        }),
      });

      return {
        backend: 'OPENSEARCH',
        index,
        error_message: null,
        scores: parseScores(response.hits),
      };
    } catch (error) {
      return {
        backend: 'POSTGRES_FALLBACK',
        index,
        error_message: errorMessage(error),
        scores: new Map(),
      };
    }
  }

  indexName() {
    return this.indexPrefix;
  }

  private async ensureIndex(index: string) {
    if (this.indexCache.has(index)) return;

    try {
      await this.request(`/${index}`, {
        method: 'GET',
      });
    } catch (error) {
      if (!(error instanceof OpenSearchHttpError) || error.status !== 404) {
        throw error;
      }

      await this.request(`/${index}`, {
        method: 'PUT',
        body: JSON.stringify({
          mappings: {
            properties: {
              content: { analyzer: 'standard', type: 'text' },
              document_id: { type: 'keyword' },
              id: { type: 'keyword' },
              keywords: { type: 'keyword' },
              knowledge_id: { type: 'keyword' },
              sort_order: { type: 'integer' },
              source_type: { type: 'keyword' },
              storage_path: { type: 'keyword' },
              tenant_id: { type: 'keyword' },
              title: { analyzer: 'standard', type: 'text' },
              token_count: { type: 'integer' },
              updated_at: { type: 'date' },
            },
          },
          settings: {
            index: {
              number_of_replicas: 0,
              number_of_shards: 1,
            },
          },
        }),
      });
    }

    this.indexCache.add(index);
  }

  private async request<T = unknown>(path: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const headers = new Headers(init.headers);

    headers.set('accept', 'application/json');
    if (init.body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');
    if (this.username && this.password) {
      headers.set('authorization', `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
      const json = await safeJson(response);

      if (!response.ok) {
        throw new OpenSearchHttpError(
          response.status,
          extractOpenSearchError(json) ?? `OpenSearch HTTP ${response.status}`,
        );
      }

      return json as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for OpenSearch configuration`);
  }

  return value;
}

class OpenSearchHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'OpenSearchHttpError';
  }
}

function termQuery(field: string, value: string) {
  return {
    term: {
      [field]: value,
    },
  };
}

function parseScores(value: unknown) {
  const scores = new Map<string, number>();

  if (!isObject(value) || !isObject(value.hits) || !Array.isArray(value.hits.hits)) {
    return scores;
  }

  for (const hit of value.hits.hits) {
    if (!isObject(hit)) continue;
    const id = typeof hit._id === 'string' ? hit._id : null;
    const score = typeof hit._score === 'number' ? hit._score : null;

    if (id && score !== null) {
      scores.set(id, score);
    }
  }

  return scores;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractBulkError(items: unknown) {
  if (!Array.isArray(items)) return 'OpenSearch bulk indexing failed';
  const failed = items.find((item) => {
    if (!isObject(item) || !isObject(item.index)) return false;
    return typeof item.index.error === 'object' || typeof item.index.error === 'string';
  });

  if (!isObject(failed) || !isObject(failed.index)) return 'OpenSearch bulk indexing failed';
  const error = failed.index.error;

  if (typeof error === 'string') return error;
  if (isObject(error) && typeof error.reason === 'string') return error.reason;
  return 'OpenSearch bulk indexing failed';
}

function extractOpenSearchError(value: unknown) {
  if (!isObject(value)) return null;
  if (typeof value.error === 'string') return value.error;
  if (isObject(value.error) && typeof value.error.reason === 'string') return value.error.reason;
  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Unknown OpenSearch error';
}

function sanitizeIndexName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
