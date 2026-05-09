import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import type {
  PluginPackageIntegrityResult,
  PluginPackageSignatureResult,
  PluginPackageSignatureType,
} from '@aiaget/shared-types';

const DEFAULT_MAX_PACKAGE_BYTES = 25 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_SIGNATURE_VERIFIER_TIMEOUT_MS = 10_000;

export interface PluginPackageDownloadResult {
  bytes: Buffer;
  finalUrl: string;
  contentLength: number | null;
  contentType: string | null;
}

export interface PluginPackageDownloader {
  download(sourceUrl: string): Promise<PluginPackageDownloadResult>;
}

export interface VerifyPluginPackageInput {
  sourceUrl: string | null;
  expectedSha256: string | null;
  signature?: string | null;
  signatureType?: PluginPackageSignatureType | null;
  signatureVerificationUrl?: string | null;
}

export interface VerifyPluginPackageSignatureInput {
  bytes: Buffer;
  sourceUrl: string;
  finalUrl: string;
  actualSha256: string;
  signature: string | null;
  signatureType: PluginPackageSignatureType | null;
  verificationUrl: string | null;
}

export interface PluginPackageSignatureVerifier {
  verify(input: VerifyPluginPackageSignatureInput): Promise<PluginPackageSignatureResult>;
}

@Injectable()
export class PluginPackageIntegrityService {
  constructor(
    private readonly downloader: PluginPackageDownloader = new HttpPluginPackageDownloader(),
    private readonly signatureVerifier: PluginPackageSignatureVerifier = createDefaultPluginPackageSignatureVerifier(),
  ) {}

  async verifyPackage(input: VerifyPluginPackageInput): Promise<PluginPackageIntegrityResult> {
    if (!input.sourceUrl || !input.expectedSha256) {
      return {
        status: 'SKIPPED',
        verified: false,
        source_url: input.sourceUrl,
        final_url: input.sourceUrl,
        expected_sha256: input.expectedSha256,
        actual_sha256: null,
        package_size_bytes: null,
        content_type: null,
        signature: null,
        error_code: 'PACKAGE_INTEGRITY_METADATA_MISSING',
        error_message: '插件包来源或 sha256 缺失，无法执行完整性校验。',
      };
    }

    try {
      const downloaded = await this.downloader.download(input.sourceUrl);
      const actualSha256 = createHash('sha256').update(downloaded.bytes).digest('hex');
      const passed = actualSha256.toLowerCase() === input.expectedSha256.toLowerCase();
      const signature = passed
        ? await this.signatureVerifier.verify({
          bytes: downloaded.bytes,
          sourceUrl: input.sourceUrl,
          finalUrl: downloaded.finalUrl,
          actualSha256,
          signature: input.signature ?? null,
          signatureType: input.signatureType ?? null,
          verificationUrl: input.signatureVerificationUrl ?? null,
        })
        : null;
      const signaturePassed = signature ? signature.status !== 'FAILED' : true;

      return {
        status: passed && signaturePassed ? 'PASSED' : 'FAILED',
        verified: passed && signaturePassed,
        source_url: input.sourceUrl,
        final_url: downloaded.finalUrl,
        expected_sha256: input.expectedSha256,
        actual_sha256: actualSha256,
        package_size_bytes: downloaded.contentLength ?? downloaded.bytes.length,
        content_type: downloaded.contentType,
        signature,
        error_code: buildIntegrityErrorCode(passed, signature),
        error_message: buildIntegrityErrorMessage(passed, signature),
      };
    } catch (error) {
      return {
        status: 'FAILED',
        verified: false,
        source_url: input.sourceUrl,
        final_url: input.sourceUrl,
        expected_sha256: input.expectedSha256,
        actual_sha256: null,
        package_size_bytes: null,
        content_type: null,
        signature: null,
        error_code: 'PACKAGE_DOWNLOAD_FAILED',
        error_message: error instanceof Error ? error.message : '插件包下载失败。',
      };
    }
  }
}

class MetadataOnlyPluginPackageSignatureVerifier implements PluginPackageSignatureVerifier {
  async verify(input: VerifyPluginPackageSignatureInput): Promise<PluginPackageSignatureResult> {
    if (!input.signature) {
      return {
        status: 'SKIPPED',
        verified: false,
        signature_type: input.signatureType ?? null,
        signature_present: false,
        verification_url: input.verificationUrl,
        subject: null,
        issuer: null,
        error_code: 'PACKAGE_SIGNATURE_MISSING',
        error_message: '插件包未提供签名，已跳过在线验签。',
      };
    }

    return {
      status: 'SKIPPED',
      verified: false,
      signature_type: input.signatureType ?? 'CUSTOM',
      signature_present: true,
      verification_url: input.verificationUrl,
      subject: null,
      issuer: null,
      error_code: 'PACKAGE_SIGNATURE_VERIFIER_NOT_CONFIGURED',
      error_message: '当前环境未配置在线签名验证器，仅记录签名元数据。',
    };
  }
}

class ExternalPluginPackageSignatureVerifier implements PluginPackageSignatureVerifier {
  constructor(
    private readonly verifierUrl: string,
    private readonly token: string | null,
    private readonly timeoutMs: number,
    private readonly fallbackVerifier: PluginPackageSignatureVerifier = new MetadataOnlyPluginPackageSignatureVerifier(),
  ) {}

  async verify(input: VerifyPluginPackageSignatureInput): Promise<PluginPackageSignatureResult> {
    if (!input.signature) {
      return this.fallbackVerifier.verify(input);
    }

    const parsedUrl = parseVerifierUrl(this.verifierUrl);
    if (!parsedUrl) {
      return buildFailedSignatureResult(input, 'PACKAGE_SIGNATURE_VERIFIER_URL_INVALID', '插件包在线签名验证器地址不是有效 HTTP/HTTPS URL。');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(parsedUrl, {
        method: 'POST',
        headers: buildVerifierHeaders(this.token),
        body: JSON.stringify({
          source_url: input.sourceUrl,
          final_url: input.finalUrl,
          actual_sha256: input.actualSha256,
          signature: input.signature,
          signature_type: input.signatureType,
          verification_url: input.verificationUrl,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return buildFailedSignatureResult(
          input,
          'PACKAGE_SIGNATURE_VERIFIER_HTTP_FAILED',
          `插件包在线签名验证器请求失败，HTTP ${response.status}。`,
        );
      }

      return normalizeVerifierResponse(input, await readVerifierJson(response));
    } catch (error) {
      return buildFailedSignatureResult(
        input,
        'PACKAGE_SIGNATURE_VERIFIER_REQUEST_FAILED',
        error instanceof Error ? `插件包在线签名验证器请求失败：${error.message}` : '插件包在线签名验证器请求失败。',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

function createDefaultPluginPackageSignatureVerifier(): PluginPackageSignatureVerifier {
  const verifierUrl = process.env.PLUGIN_SIGNATURE_VERIFIER_URL?.trim();
  if (!verifierUrl) return new MetadataOnlyPluginPackageSignatureVerifier();

  return new ExternalPluginPackageSignatureVerifier(
    verifierUrl,
    process.env.PLUGIN_SIGNATURE_VERIFIER_TOKEN?.trim() || null,
    parsePositiveInteger(process.env.PLUGIN_SIGNATURE_VERIFIER_TIMEOUT_MS, DEFAULT_SIGNATURE_VERIFIER_TIMEOUT_MS),
  );
}

function parseVerifierUrl(verifierUrl: string) {
  try {
    const parsed = new URL(verifierUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildVerifierHeaders(token: string | null) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

async function readVerifierJson(response: Response) {
  try {
    return await response.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeVerifierResponse(input: VerifyPluginPackageSignatureInput, body: Record<string, unknown> | null): PluginPackageSignatureResult {
  if (!body) {
    return buildFailedSignatureResult(input, 'PACKAGE_SIGNATURE_VERIFIER_RESPONSE_INVALID', '插件包在线签名验证器返回了无效 JSON。');
  }

  const status = normalizeSignatureStatus(readString(body.status));
  if (!status) {
    return buildFailedSignatureResult(input, 'PACKAGE_SIGNATURE_VERIFIER_RESPONSE_INVALID', '插件包在线签名验证器返回结果缺少有效状态。');
  }

  const verified = readBoolean(body.verified) ?? status === 'PASSED';
  return {
    status,
    verified: status === 'PASSED' ? verified : false,
    signature_type: normalizeSignatureType(readString(body.signature_type)) ?? input.signatureType ?? 'CUSTOM',
    signature_present: readBoolean(body.signature_present) ?? Boolean(input.signature),
    verification_url: readString(body.verification_url) ?? input.verificationUrl,
    subject: readString(body.subject),
    issuer: readString(body.issuer),
    error_code: readString(body.error_code) ?? (status === 'FAILED' ? 'PACKAGE_SIGNATURE_REJECTED' : null),
    error_message: readString(body.error_message) ?? (status === 'FAILED' ? '插件包签名校验失败。' : null),
  };
}

function buildFailedSignatureResult(
  input: VerifyPluginPackageSignatureInput,
  errorCode: string,
  errorMessage: string,
): PluginPackageSignatureResult {
  return {
    status: 'FAILED',
    verified: false,
    signature_type: input.signatureType ?? 'CUSTOM',
    signature_present: Boolean(input.signature),
    verification_url: input.verificationUrl,
    subject: null,
    issuer: null,
    error_code: errorCode,
    error_message: errorMessage,
  };
}

function normalizeSignatureStatus(value: string | null) {
  if (value === 'PASSED' || value === 'FAILED' || value === 'SKIPPED') return value;
  return null;
}

function normalizeSignatureType(value: string | null): PluginPackageSignatureType | null {
  if (value === 'SIGSTORE' || value === 'PGP' || value === 'CUSTOM') return value;
  return null;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : null;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildIntegrityErrorCode(passed: boolean, signature: PluginPackageSignatureResult | null) {
  if (!passed) return 'PACKAGE_SHA256_MISMATCH';
  if (signature?.status === 'FAILED') return signature.error_code ?? 'PACKAGE_SIGNATURE_FAILED';
  return null;
}

function buildIntegrityErrorMessage(passed: boolean, signature: PluginPackageSignatureResult | null) {
  if (!passed) return '插件包 sha256 与 Manifest 声明不一致。';
  if (signature?.status === 'FAILED') return signature.error_message ?? '插件包签名校验失败。';
  return null;
}

class HttpPluginPackageDownloader implements PluginPackageDownloader {
  async download(sourceUrl: string): Promise<PluginPackageDownloadResult> {
    const parsed = parseHttpUrl(sourceUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(parsed, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new BadRequestException(`插件包下载失败，HTTP ${response.status}`);
      }

      const contentLengthHeader = response.headers.get('content-length');
      const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : null;
      if (contentLength && contentLength > DEFAULT_MAX_PACKAGE_BYTES) {
        throw new BadRequestException(`插件包超过 ${DEFAULT_MAX_PACKAGE_BYTES} 字节限制。`);
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > DEFAULT_MAX_PACKAGE_BYTES) {
        throw new BadRequestException(`插件包超过 ${DEFAULT_MAX_PACKAGE_BYTES} 字节限制。`);
      }

      return {
        bytes: Buffer.from(arrayBuffer),
        finalUrl: response.url || sourceUrl,
        contentLength: contentLength ?? arrayBuffer.byteLength,
        contentType: response.headers.get('content-type'),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseHttpUrl(sourceUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new BadRequestException('插件包来源不是有效 URL。');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new BadRequestException('当前仅支持通过 HTTP/HTTPS 下载插件包。');
  }

  return parsed;
}
