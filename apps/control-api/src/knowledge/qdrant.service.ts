import { Injectable } from '@nestjs/common';

const DEFAULT_COLLECTION_PREFIX = 'aiaget_knowledge_segments';
const REQUEST_TIMEOUT_MS = 2500;

export interface QdrantSegmentPoint {
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
  embeddingModel: string;
  vector: number[];
}

export interface QdrantSearchResult {
  backend: 'QDRANT' | 'POSTGRES_FALLBACK';
  collection: string | null;
  error_message: string | null;
  scores: Map<string, number>;
}

export interface QdrantWriteResult {
  backend: 'QDRANT' | 'POSTGRES_FALLBACK';
  collection: string | null;
  indexed_count: number;
  error_message: string | null;
}

@Injectable()
export class QdrantService {
  private readonly enabled = process.env.QDRANT_ENABLED !== 'false';
  private readonly baseUrl = resolveBaseUrl('QDRANT_URL', this.enabled);
  private readonly apiKey = process.env.QDRANT_API_KEY?.trim() || null;
  private readonly collectionPrefix = sanitizeCollectionName(process.env.QDRANT_COLLECTION_PREFIX ?? DEFAULT_COLLECTION_PREFIX);
  private readonly collectionCache = new Set<string>();

  async upsertSegments(points: QdrantSegmentPoint[]): Promise<QdrantWriteResult> {
    const firstVector = points.find((point) => point.vector.length > 0)?.vector ?? [];
    const collection = firstVector.length > 0 ? this.collectionForDimension(firstVector.length) : null;

    if (!this.enabled || !collection || points.length === 0) {
      return {
        backend: 'POSTGRES_FALLBACK',
        collection,
        indexed_count: 0,
        error_message: 'Qdrant is not enabled or no vector payload is available',
      };
    }

    try {
      await this.ensureCollection(collection, firstVector.length);
      await this.request(`/collections/${collection}/points?wait=true`, {
        method: 'PUT',
        body: JSON.stringify({
          points: points
            .filter((point) => point.vector.length === firstVector.length)
            .map((point) => ({
              id: point.id,
              vector: point.vector,
              payload: {
                tenant_id: point.tenantId,
                knowledge_id: point.knowledgeId,
                document_id: point.documentId,
                title: point.title,
                source_type: point.sourceType,
                content: point.content,
                keywords: point.keywords,
                token_count: point.tokenCount,
                sort_order: point.sortOrder,
                embedding_model: point.embeddingModel,
              },
            })),
        }),
      });

      return {
        backend: 'QDRANT',
        collection,
        indexed_count: points.length,
        error_message: null,
      };
    } catch (error) {
      return {
        backend: 'POSTGRES_FALLBACK',
        collection,
        indexed_count: 0,
        error_message: errorMessage(error),
      };
    }
  }

  async deleteDocumentSegments(input: {
    tenantId: string;
    knowledgeId: string;
    documentId: string;
    vectorSizes: number[];
  }): Promise<QdrantWriteResult> {
    if (!this.enabled || input.vectorSizes.length === 0) {
      return {
        backend: 'POSTGRES_FALLBACK',
        collection: null,
        indexed_count: 0,
        error_message: 'Qdrant is not enabled or no vector size is available',
      };
    }

    let deletedCollections = 0;
    let lastCollection: string | null = null;

    try {
      for (const vectorSize of new Set(input.vectorSizes.filter((size) => size > 0))) {
        const collection = this.collectionForDimension(vectorSize);

        lastCollection = collection;
        await this.request(`/collections/${collection}/points/delete?wait=true`, {
          method: 'POST',
          body: JSON.stringify({
            filter: {
              must: [
                matchValue('tenant_id', input.tenantId),
                matchValue('knowledge_id', input.knowledgeId),
                matchValue('document_id', input.documentId),
              ],
            },
          }),
        });
        deletedCollections += 1;
      }

      return {
        backend: 'QDRANT',
        collection: lastCollection,
        indexed_count: deletedCollections,
        error_message: null,
      };
    } catch (error) {
      return {
        backend: 'POSTGRES_FALLBACK',
        collection: lastCollection,
        indexed_count: 0,
        error_message: errorMessage(error),
      };
    }
  }

  async searchSegments(input: {
    tenantId: string;
    knowledgeId: string;
    queryVector: number[];
    limit: number;
  }): Promise<QdrantSearchResult> {
    const collection = input.queryVector.length > 0 ? this.collectionForDimension(input.queryVector.length) : null;

    if (!this.enabled || !collection) {
      return {
        backend: 'POSTGRES_FALLBACK',
        collection,
        error_message: 'Qdrant is not enabled or query vector is empty',
        scores: new Map(),
      };
    }

    try {
      await this.ensureCollection(collection, input.queryVector.length);
      const response = await this.request<{ result?: unknown }>(`/collections/${collection}/points/search`, {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            must: [
              matchValue('tenant_id', input.tenantId),
              matchValue('knowledge_id', input.knowledgeId),
            ],
          },
          limit: Math.max(1, input.limit),
          vector: input.queryVector,
          with_payload: false,
          with_vector: false,
        }),
      });

      return {
        backend: 'QDRANT',
        collection,
        error_message: null,
        scores: parseScores(response.result),
      };
    } catch (error) {
      return {
        backend: 'POSTGRES_FALLBACK',
        collection,
        error_message: errorMessage(error),
        scores: new Map(),
      };
    }
  }

  collectionForDimension(dimension: number) {
    return sanitizeCollectionName(`${this.collectionPrefix}_${dimension}`);
  }

  private async ensureCollection(collection: string, vectorSize: number) {
    if (this.collectionCache.has(collection)) return;

    try {
      await this.request(`/collections/${collection}`, {
        method: 'GET',
      });
    } catch (error) {
      if (!(error instanceof QdrantHttpError) || error.status !== 404) {
        throw error;
      }

      await this.request(`/collections/${collection}`, {
        method: 'PUT',
        body: JSON.stringify({
          vectors: {
            distance: 'Cosine',
            size: vectorSize,
          },
        }),
      });
    }

    this.collectionCache.add(collection);
  }

  private async request<T = unknown>(path: string, init: RequestInit): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('QDRANT_URL is required when QDRANT_ENABLED=true');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const headers = new Headers(init.headers);

    headers.set('accept', 'application/json');
    if (init.body !== undefined) headers.set('content-type', 'application/json');
    if (this.apiKey) headers.set('api-key', this.apiKey);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
      const json = await safeJson(response);

      if (!response.ok) {
        throw new QdrantHttpError(response.status, extractQdrantError(json) ?? `Qdrant HTTP ${response.status}`);
      }

      return json as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function resolveBaseUrl(name: string, enabled: boolean) {
  const value = process.env[name]?.trim();

  if (!value) {
    if (!enabled) return null;
    throw new Error(`${name} is required when QDRANT_ENABLED=true`);
  }

  return trimTrailingSlash(value);
}

class QdrantHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'QdrantHttpError';
  }
}

function matchValue(key: string, value: string) {
  return {
    key,
    match: {
      value,
    },
  };
}

function parseScores(value: unknown) {
  const scores = new Map<string, number>();

  if (!Array.isArray(value)) return scores;

  for (const item of value) {
    if (!isObject(item)) continue;
    const id = typeof item.id === 'string' ? item.id : null;
    const score = typeof item.score === 'number' ? item.score : null;

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

function extractQdrantError(value: unknown) {
  if (!isObject(value)) return null;
  if (typeof value.status === 'object' && value.status !== null) {
    const status = value.status as Record<string, unknown>;
    if (typeof status.error === 'string') return status.error;
  }
  if (typeof value.status === 'string') return value.status;
  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Unknown Qdrant error';
}

function sanitizeCollectionName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
