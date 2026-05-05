import assert from 'node:assert/strict';
import test from 'node:test';

import { OpenSearchService } from './opensearch.service';
import { QdrantService } from './qdrant.service';

test('QdrantService can be constructed with QDRANT_ENABLED=false and no URL', async () => {
  const previousEnabled = process.env.QDRANT_ENABLED;
  const previousUrl = process.env.QDRANT_URL;
  process.env.QDRANT_ENABLED = 'false';
  delete process.env.QDRANT_URL;

  try {
    const service = new QdrantService();
    const result = await service.searchSegments({
      tenantId: 'tenant-1',
      knowledgeId: 'knowledge-1',
      queryVector: [1, 0, 0],
      limit: 5,
    });

    assert.equal(result.backend, 'POSTGRES_FALLBACK');
    assert.match(result.error_message ?? '', /Qdrant is not enabled/);
  } finally {
    restoreEnv('QDRANT_ENABLED', previousEnabled);
    restoreEnv('QDRANT_URL', previousUrl);
  }
});

test('QdrantService requires QDRANT_URL when explicitly enabled', () => {
  const previousEnabled = process.env.QDRANT_ENABLED;
  const previousUrl = process.env.QDRANT_URL;
  process.env.QDRANT_ENABLED = 'true';
  delete process.env.QDRANT_URL;

  try {
    assert.throws(() => new QdrantService(), /QDRANT_URL is required when QDRANT_ENABLED=true/);
  } finally {
    restoreEnv('QDRANT_ENABLED', previousEnabled);
    restoreEnv('QDRANT_URL', previousUrl);
  }
});

test('OpenSearchService can be constructed with OPENSEARCH_ENABLED=false and no URL', async () => {
  const previousEnabled = process.env.OPENSEARCH_ENABLED;
  const previousUrl = process.env.OPENSEARCH_URL;
  process.env.OPENSEARCH_ENABLED = 'false';
  delete process.env.OPENSEARCH_URL;

  try {
    const service = new OpenSearchService();
    const result = await service.searchSegments({
      tenantId: 'tenant-1',
      knowledgeId: 'knowledge-1',
      query: 'refund policy',
      limit: 5,
    });

    assert.equal(result.backend, 'POSTGRES_FALLBACK');
    assert.match(result.error_message ?? '', /OpenSearch is not enabled/);
  } finally {
    restoreEnv('OPENSEARCH_ENABLED', previousEnabled);
    restoreEnv('OPENSEARCH_URL', previousUrl);
  }
});

test('OpenSearchService requires OPENSEARCH_URL when explicitly enabled', () => {
  const previousEnabled = process.env.OPENSEARCH_ENABLED;
  const previousUrl = process.env.OPENSEARCH_URL;
  process.env.OPENSEARCH_ENABLED = 'true';
  delete process.env.OPENSEARCH_URL;

  try {
    assert.throws(() => new OpenSearchService(), /OPENSEARCH_URL is required when OPENSEARCH_ENABLED=true/);
  } finally {
    restoreEnv('OPENSEARCH_ENABLED', previousEnabled);
    restoreEnv('OPENSEARCH_URL', previousUrl);
  }
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
