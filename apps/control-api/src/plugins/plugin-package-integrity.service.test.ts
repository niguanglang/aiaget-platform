import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';

import { PluginPackageIntegrityService } from './plugin-package-integrity.service';

test('verifies plugin package sha256 from downloaded package bytes', async () => {
  const packageBytes = Buffer.from('plugin-package-content');
  const expectedSha256 = createHash('sha256').update(packageBytes).digest('hex');
  const service = new PluginPackageIntegrityService({
    download: async (url) => ({
      bytes: packageBytes,
      finalUrl: url,
      contentLength: packageBytes.length,
      contentType: 'application/gzip',
    }),
  });

  const result = await service.verifyPackage({
    sourceUrl: 'https://plugins.example.com/ticket-suite.tgz',
    expectedSha256,
  });

  assert.equal(result.status, 'PASSED');
  assert.equal(result.actual_sha256, expectedSha256);
  assert.equal(result.package_size_bytes, packageBytes.length);
  assert.equal(result.verified, true);
});

test('fails plugin package integrity when downloaded sha256 mismatches manifest metadata', async () => {
  const packageBytes = Buffer.from('tampered-plugin-package-content');
  const service = new PluginPackageIntegrityService({
    download: async (url) => ({
      bytes: packageBytes,
      finalUrl: url,
      contentLength: packageBytes.length,
      contentType: 'application/gzip',
    }),
  });

  const result = await service.verifyPackage({
    sourceUrl: 'https://plugins.example.com/ticket-suite.tgz',
    expectedSha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  });

  assert.equal(result.status, 'FAILED');
  assert.equal(result.verified, false);
  assert.equal(result.error_code, 'PACKAGE_SHA256_MISMATCH');
  assert.equal(result.actual_sha256, createHash('sha256').update(packageBytes).digest('hex'));
});

test('verifies plugin package signature after sha256 passes', async () => {
  const packageBytes = Buffer.from('signed-plugin-package-content');
  const expectedSha256 = createHash('sha256').update(packageBytes).digest('hex');
  let verifierCalled = false;
  const service = new PluginPackageIntegrityService(
    {
      download: async (url) => ({
        bytes: packageBytes,
        finalUrl: url,
        contentLength: packageBytes.length,
        contentType: 'application/gzip',
      }),
    },
    {
      verify: async (input) => {
        verifierCalled = true;
        assert.equal(input.actualSha256, expectedSha256);
        assert.equal(input.signature, 'sigstore-bundle');
        assert.equal(input.signatureType, 'SIGSTORE');
        return {
          status: 'PASSED',
          verified: true,
          signature_type: 'SIGSTORE',
          signature_present: true,
          verification_url: 'https://verify.example.com/sigstore',
          subject: 'ticket-suite',
          issuer: 'sigstore',
          error_code: null,
          error_message: null,
        };
      },
    },
  );

  const result = await service.verifyPackage({
    sourceUrl: 'https://plugins.example.com/ticket-suite.tgz',
    expectedSha256,
    signature: 'sigstore-bundle',
    signatureType: 'SIGSTORE',
    signatureVerificationUrl: 'https://verify.example.com/sigstore',
  });

  assert.equal(verifierCalled, true);
  assert.equal(result.status, 'PASSED');
  assert.equal(result.verified, true);
  assert.equal(result.signature?.verified, true);
  assert.equal(result.signature?.subject, 'ticket-suite');
});

test('fails plugin package integrity when signature verification fails', async () => {
  const packageBytes = Buffer.from('signed-plugin-package-content');
  const expectedSha256 = createHash('sha256').update(packageBytes).digest('hex');
  const service = new PluginPackageIntegrityService(
    {
      download: async (url) => ({
        bytes: packageBytes,
        finalUrl: url,
        contentLength: packageBytes.length,
        contentType: 'application/gzip',
      }),
    },
    {
      verify: async () => ({
        status: 'FAILED',
        verified: false,
        signature_type: 'PGP',
        signature_present: true,
        verification_url: 'https://verify.example.com/pgp',
        subject: null,
        issuer: null,
        error_code: 'PACKAGE_SIGNATURE_REJECTED',
        error_message: '插件包签名校验失败。',
      }),
    },
  );

  const result = await service.verifyPackage({
    sourceUrl: 'https://plugins.example.com/ticket-suite.tgz',
    expectedSha256,
    signature: 'pgp-signature',
    signatureType: 'PGP',
    signatureVerificationUrl: 'https://verify.example.com/pgp',
  });

  assert.equal(result.status, 'FAILED');
  assert.equal(result.verified, false);
  assert.equal(result.error_code, 'PACKAGE_SIGNATURE_REJECTED');
  assert.equal(result.signature?.verified, false);
});

test('posts package signature metadata to configured external verifier', async () => {
  const packageBytes = Buffer.from('externally-signed-plugin-package-content');
  const expectedSha256 = createHash('sha256').update(packageBytes).digest('hex');
  const previousVerifierUrl = process.env.PLUGIN_SIGNATURE_VERIFIER_URL;
  const previousVerifierToken = process.env.PLUGIN_SIGNATURE_VERIFIER_TOKEN;
  const originalFetch = globalThis.fetch;
  let postedBody: Record<string, unknown> | null = null;
  let postedAuthorization: string | null = null;

  process.env.PLUGIN_SIGNATURE_VERIFIER_URL = 'https://verifier.example.com/plugin-signatures';
  process.env.PLUGIN_SIGNATURE_VERIFIER_TOKEN = 'enterprise-verifier-token';
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    postedAuthorization = init?.headers instanceof Headers
      ? init.headers.get('authorization')
      : (init?.headers as Record<string, string> | undefined)?.authorization ?? null;
    postedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({
      status: 'PASSED',
      verified: true,
      signature_type: 'SIGSTORE',
      subject: 'ticket-suite',
      issuer: 'enterprise-sigstore',
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const service = new PluginPackageIntegrityService({
      download: async (url) => ({
        bytes: packageBytes,
        finalUrl: `${url}?download=1`,
        contentLength: packageBytes.length,
        contentType: 'application/gzip',
      }),
    });

    const result = await service.verifyPackage({
      sourceUrl: 'https://plugins.example.com/ticket-suite.tgz',
      expectedSha256,
      signature: 'sigstore-bundle',
      signatureType: 'SIGSTORE',
      signatureVerificationUrl: 'https://rekor.example.com/log/entry',
    });

    assert.equal(result.status, 'PASSED');
    assert.equal(result.verified, true);
    assert.equal(result.signature?.status, 'PASSED');
    assert.equal(result.signature?.subject, 'ticket-suite');
    assert.equal(postedAuthorization, 'Bearer enterprise-verifier-token');
    assert.deepEqual(postedBody, {
      source_url: 'https://plugins.example.com/ticket-suite.tgz',
      final_url: 'https://plugins.example.com/ticket-suite.tgz?download=1',
      actual_sha256: expectedSha256,
      signature: 'sigstore-bundle',
      signature_type: 'SIGSTORE',
      verification_url: 'https://rekor.example.com/log/entry',
    });
  } finally {
    restoreEnv('PLUGIN_SIGNATURE_VERIFIER_URL', previousVerifierUrl);
    restoreEnv('PLUGIN_SIGNATURE_VERIFIER_TOKEN', previousVerifierToken);
    globalThis.fetch = originalFetch;
  }
});

test('fails package integrity when configured external verifier rejects signature', async () => {
  const packageBytes = Buffer.from('rejected-plugin-package-content');
  const expectedSha256 = createHash('sha256').update(packageBytes).digest('hex');
  const previousVerifierUrl = process.env.PLUGIN_SIGNATURE_VERIFIER_URL;
  const previousVerifierToken = process.env.PLUGIN_SIGNATURE_VERIFIER_TOKEN;
  const originalFetch = globalThis.fetch;

  process.env.PLUGIN_SIGNATURE_VERIFIER_URL = 'https://verifier.example.com/plugin-signatures';
  delete process.env.PLUGIN_SIGNATURE_VERIFIER_TOKEN;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    status: 'FAILED',
    verified: false,
    signature_type: 'PGP',
    signature_present: true,
    error_code: 'PACKAGE_SIGNATURE_REJECTED',
    error_message: '签名主体不在允许列表内。',
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })) as typeof fetch;

  try {
    const service = new PluginPackageIntegrityService({
      download: async (url) => ({
        bytes: packageBytes,
        finalUrl: url,
        contentLength: packageBytes.length,
        contentType: 'application/gzip',
      }),
    });

    const result = await service.verifyPackage({
      sourceUrl: 'https://plugins.example.com/ticket-suite.tgz',
      expectedSha256,
      signature: 'pgp-signature',
      signatureType: 'PGP',
      signatureVerificationUrl: 'https://keys.example.com/ticket-suite.asc',
    });

    assert.equal(result.status, 'FAILED');
    assert.equal(result.verified, false);
    assert.equal(result.error_code, 'PACKAGE_SIGNATURE_REJECTED');
    assert.equal(result.error_message, '签名主体不在允许列表内。');
    assert.equal(result.signature?.status, 'FAILED');
  } finally {
    restoreEnv('PLUGIN_SIGNATURE_VERIFIER_URL', previousVerifierUrl);
    restoreEnv('PLUGIN_SIGNATURE_VERIFIER_TOKEN', previousVerifierToken);
    globalThis.fetch = originalFetch;
  }
});

test('fails package integrity when configured external verifier returns an HTTP error', async () => {
  const packageBytes = Buffer.from('verifier-http-error-package-content');
  const expectedSha256 = createHash('sha256').update(packageBytes).digest('hex');
  const previousVerifierUrl = process.env.PLUGIN_SIGNATURE_VERIFIER_URL;
  const originalFetch = globalThis.fetch;

  process.env.PLUGIN_SIGNATURE_VERIFIER_URL = 'https://verifier.example.com/plugin-signatures';
  globalThis.fetch = (async () => new Response(JSON.stringify({ message: 'service unavailable' }), {
    status: 503,
    headers: { 'content-type': 'application/json' },
  })) as typeof fetch;

  try {
    const service = new PluginPackageIntegrityService({
      download: async (url) => ({
        bytes: packageBytes,
        finalUrl: url,
        contentLength: packageBytes.length,
        contentType: 'application/gzip',
      }),
    });

    const result = await service.verifyPackage({
      sourceUrl: 'https://plugins.example.com/ticket-suite.tgz',
      expectedSha256,
      signature: 'custom-signature',
      signatureType: 'CUSTOM',
    });

    assert.equal(result.status, 'FAILED');
    assert.equal(result.verified, false);
    assert.equal(result.error_code, 'PACKAGE_SIGNATURE_VERIFIER_HTTP_FAILED');
    assert.match(result.error_message ?? '', /HTTP 503/);
  } finally {
    restoreEnv('PLUGIN_SIGNATURE_VERIFIER_URL', previousVerifierUrl);
    globalThis.fetch = originalFetch;
  }
});

test('verifies custom package signature with configured local public key verifier', async () => {
  const packageBytes = Buffer.from('locally-signed-custom-plugin-package-content');
  const expectedSha256 = createHash('sha256').update(packageBytes).digest('hex');
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const signature = sign('RSA-SHA256', packageBytes, privateKey).toString('base64');
  const previousVerifierUrl = process.env.PLUGIN_SIGNATURE_VERIFIER_URL;
  const previousPublicKey = process.env.PLUGIN_SIGNATURE_PUBLIC_KEY;
  const previousAlgorithm = process.env.PLUGIN_SIGNATURE_LOCAL_ALGORITHM;

  delete process.env.PLUGIN_SIGNATURE_VERIFIER_URL;
  process.env.PLUGIN_SIGNATURE_PUBLIC_KEY = publicKey.export({ format: 'pem', type: 'spki' }).toString();
  process.env.PLUGIN_SIGNATURE_LOCAL_ALGORITHM = 'RSA-SHA256';

  try {
    const service = new PluginPackageIntegrityService({
      download: async (url) => ({
        bytes: packageBytes,
        finalUrl: url,
        contentLength: packageBytes.length,
        contentType: 'application/gzip',
      }),
    });

    const result = await service.verifyPackage({
      sourceUrl: 'https://plugins.example.com/ticket-suite.tgz',
      expectedSha256,
      signature,
      signatureType: 'CUSTOM',
    });

    assert.equal(result.status, 'PASSED');
    assert.equal(result.verified, true);
    assert.equal(result.signature?.status, 'PASSED');
    assert.equal(result.signature?.verified, true);
    assert.equal(result.signature?.issuer, 'local-public-key');
  } finally {
    restoreEnv('PLUGIN_SIGNATURE_VERIFIER_URL', previousVerifierUrl);
    restoreEnv('PLUGIN_SIGNATURE_PUBLIC_KEY', previousPublicKey);
    restoreEnv('PLUGIN_SIGNATURE_LOCAL_ALGORITHM', previousAlgorithm);
  }
});

test('fails custom package signature when local public key verifier rejects detached signature', async () => {
  const packageBytes = Buffer.from('locally-signed-custom-plugin-package-content');
  const tamperedBytes = Buffer.from('tampered-local-signature-content');
  const expectedSha256 = createHash('sha256').update(tamperedBytes).digest('hex');
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const signature = sign('RSA-SHA256', packageBytes, privateKey).toString('base64');
  const previousVerifierUrl = process.env.PLUGIN_SIGNATURE_VERIFIER_URL;
  const previousPublicKey = process.env.PLUGIN_SIGNATURE_PUBLIC_KEY;
  const previousAlgorithm = process.env.PLUGIN_SIGNATURE_LOCAL_ALGORITHM;

  delete process.env.PLUGIN_SIGNATURE_VERIFIER_URL;
  process.env.PLUGIN_SIGNATURE_PUBLIC_KEY = publicKey.export({ format: 'pem', type: 'spki' }).toString();
  process.env.PLUGIN_SIGNATURE_LOCAL_ALGORITHM = 'RSA-SHA256';

  try {
    const service = new PluginPackageIntegrityService({
      download: async (url) => ({
        bytes: tamperedBytes,
        finalUrl: url,
        contentLength: tamperedBytes.length,
        contentType: 'application/gzip',
      }),
    });

    const result = await service.verifyPackage({
      sourceUrl: 'https://plugins.example.com/ticket-suite.tgz',
      expectedSha256,
      signature,
      signatureType: 'CUSTOM',
    });

    assert.equal(result.status, 'FAILED');
    assert.equal(result.verified, false);
    assert.equal(result.error_code, 'PACKAGE_SIGNATURE_REJECTED');
    assert.equal(result.signature?.status, 'FAILED');
  } finally {
    restoreEnv('PLUGIN_SIGNATURE_VERIFIER_URL', previousVerifierUrl);
    restoreEnv('PLUGIN_SIGNATURE_PUBLIC_KEY', previousPublicKey);
    restoreEnv('PLUGIN_SIGNATURE_LOCAL_ALGORITHM', previousAlgorithm);
  }
});

test('fails package integrity when signed package has no configured signature verifier', async () => {
  const packageBytes = Buffer.from('metadata-only-signature-package-content');
  const expectedSha256 = createHash('sha256').update(packageBytes).digest('hex');
  const previousVerifierUrl = process.env.PLUGIN_SIGNATURE_VERIFIER_URL;
  delete process.env.PLUGIN_SIGNATURE_VERIFIER_URL;

  try {
    const service = new PluginPackageIntegrityService({
      download: async (url) => ({
        bytes: packageBytes,
        finalUrl: url,
        contentLength: packageBytes.length,
        contentType: 'application/gzip',
      }),
    });

    const result = await service.verifyPackage({
      sourceUrl: 'https://plugins.example.com/ticket-suite.tgz',
      expectedSha256,
      signature: 'custom-signature',
      signatureType: 'CUSTOM',
    });

    assert.equal(result.status, 'FAILED');
    assert.equal(result.verified, false);
    assert.equal(result.error_code, 'PACKAGE_SIGNATURE_VERIFIER_NOT_CONFIGURED');
    assert.equal(result.signature?.status, 'SKIPPED');
    assert.equal(result.signature?.error_code, 'PACKAGE_SIGNATURE_VERIFIER_NOT_CONFIGURED');
  } finally {
    restoreEnv('PLUGIN_SIGNATURE_VERIFIER_URL', previousVerifierUrl);
  }
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
