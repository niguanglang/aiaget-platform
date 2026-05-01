import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type {
  StorageConnectionStatus,
  StorageDownloadUrlResult,
  StorageEnsureBucketResult,
  StorageObjectItem,
  StorageObjectListResult,
  StorageObjectUploadResult,
  StorageSettings,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import type { ListStorageObjectsDto } from './dto/list-storage-objects.dto';
import type { UploadStorageObjectDto } from './dto/upload-storage-object.dto';

const DEFAULT_BUCKET = 'aiaget-files';
const DEFAULT_REGION = 'us-east-1';
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly endpoint = requireEnv('MINIO_ENDPOINT');
  private readonly consoleUrl = requireEnv('MINIO_CONSOLE');
  private readonly accessKeyId = requireEnv('MINIO_ROOT_USER');
  private readonly secretAccessKey = requireEnv('MINIO_ROOT_PASSWORD');
  private readonly bucket = process.env.MINIO_BUCKET?.trim() || DEFAULT_BUCKET;
  private readonly region = process.env.MINIO_REGION?.trim() || DEFAULT_REGION;
  private readonly forcePathStyle = true;

  constructor() {
    this.client = new S3Client({
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
      endpoint: this.endpoint,
      forcePathStyle: this.forcePathStyle,
      region: this.region,
    });
  }

  async getSettings(): Promise<StorageSettings> {
    const bucketStatus = await this.checkBucket();

    return {
      provider: 'MINIO',
      endpoint: this.endpoint,
      console_url: this.consoleUrl,
      bucket: this.bucket,
      region: this.region,
      access_key_masked: maskAccessKey(this.accessKeyId),
      force_path_style: this.forcePathStyle,
      status: bucketStatus.status,
      bucket_exists: bucketStatus.bucketExists,
      last_checked_at: new Date().toISOString(),
      error_message: bucketStatus.errorMessage,
    };
  }

  async ensureBucket(): Promise<StorageEnsureBucketResult> {
    const current = await this.checkBucket();

    if (current.bucketExists) {
      return {
        bucket: this.bucket,
        bucket_created: false,
        bucket_exists: true,
        status: 'CONNECTED',
      };
    }

    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));

      return {
        bucket: this.bucket,
        bucket_created: true,
        bucket_exists: true,
        status: 'CONNECTED',
      };
    } catch (error) {
      throw new ServiceUnavailableException(`MinIO bucket initialization failed: ${errorMessage(error)}`);
    }
  }

  async listObjects(
    currentUser: AuthenticatedUser,
    query: ListStorageObjectsDto,
  ): Promise<StorageObjectListResult> {
    await this.assertBucketReady();

    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const tenantPrefix = buildTenantPrefix(currentUser.tenantId);
    const folderPrefix = normalizeFolder(query.prefix);
    const listPrefix = `${tenantPrefix}${folderPrefix}`;
    const keyword = query.keyword?.trim().toLowerCase();
    const objects: StorageObjectItem[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
          Prefix: listPrefix,
        }),
      );

      for (const object of response.Contents ?? []) {
        if (!object.Key || object.Key.endsWith('/')) continue;
        const item = mapObjectItem(tenantPrefix, object.Key, object.Size ?? 0, object.ETag, object.LastModified);
        if (keyword && !`${item.relative_key} ${item.file_name} ${item.folder}`.toLowerCase().includes(keyword)) {
          continue;
        }
        objects.push(item);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    const totalSize = objects.reduce((sum, item) => sum + item.size_bytes, 0);
    const paged = objects.slice((page - 1) * pageSize, page * pageSize);

    return {
      summary: {
        object_count: objects.length,
        total_size_bytes: totalSize,
        bucket_exists: true,
        status: 'CONNECTED',
      },
      items: paged,
      page,
      page_size: pageSize,
      total: objects.length,
    };
  }

  async uploadObject(
    currentUser: AuthenticatedUser,
    dto: UploadStorageObjectDto,
  ): Promise<StorageObjectUploadResult> {
    await this.assertBucketReady();

    const buffer = decodeBase64Payload(dto.content_base64);
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File is larger than the 25MB API upload limit');
    }

    const tenantPrefix = buildTenantPrefix(currentUser.tenantId);
    const folder = normalizeFolder(dto.folder);
    const fileName = sanitizeFileName(dto.file_name);
    const key = `${tenantPrefix}${folder}${fileName}`;
    const contentType = dto.content_type?.trim() || 'application/octet-stream';

    await this.client.send(
      new PutObjectCommand({
        Body: buffer,
        Bucket: this.bucket,
        ContentLength: buffer.byteLength,
        ContentType: contentType,
        Key: key,
        Metadata: {
          original_name: fileName,
          tenant_id: currentUser.tenantId,
          uploaded_by: currentUser.id,
        },
      }),
    );

    return {
      item: mapObjectItem(tenantPrefix, key, buffer.byteLength, null, new Date()),
    };
  }

  async deleteObject(currentUser: AuthenticatedUser, key: string): Promise<{ success: boolean }> {
    await this.assertBucketReady();

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: toTenantObjectKey(currentUser.tenantId, key),
      }),
    );

    return { success: true };
  }

  async getDownloadUrl(currentUser: AuthenticatedUser, key: string): Promise<StorageDownloadUrlResult> {
    await this.assertBucketReady();

    const expiresIn = 300;
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: toTenantObjectKey(currentUser.tenantId, key),
    });

    return {
      url: await getSignedUrl(this.client, command, { expiresIn }),
      expires_in: expiresIn,
    };
  }

  private async assertBucketReady() {
    const status = await this.checkBucket();

    if (!status.bucketExists) {
      throw new ServiceUnavailableException(status.errorMessage ?? 'MinIO bucket is not ready');
    }
  }

  private async checkBucket(): Promise<{
    bucketExists: boolean;
    errorMessage: string | null;
    status: StorageConnectionStatus;
  }> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));

      return {
        bucketExists: true,
        errorMessage: null,
        status: 'CONNECTED',
      };
    } catch (error) {
      return {
        bucketExists: false,
        errorMessage: errorMessage(error),
        status: 'UNAVAILABLE',
      };
    }
  }
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for MinIO storage configuration`);
  }

  return value;
}

function buildTenantPrefix(tenantId: string) {
  return `tenants/${tenantId}/`;
}

function normalizeFolder(value?: string | null) {
  const folder = sanitizeRelativeKey(value ?? 'uploads');
  if (!folder) return '';
  return folder.endsWith('/') ? folder : `${folder}/`;
}

function sanitizeRelativeKey(value: string) {
  return value
    .replaceAll('\\', '/')
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/');
}

function sanitizeFileName(value: string) {
  const normalized = value.replaceAll('\\', '/').split('/').pop()?.trim();
  if (!normalized) {
    throw new BadRequestException('File name is required');
  }

  return normalized.replace(/[^\w.\-\u4e00-\u9fa5() ]/g, '_');
}

function toTenantObjectKey(tenantId: string, key: string) {
  const relativeKey = sanitizeRelativeKey(key);
  if (!relativeKey) {
    throw new BadRequestException('Object key is required');
  }

  return `${buildTenantPrefix(tenantId)}${relativeKey}`;
}

function mapObjectItem(
  tenantPrefix: string,
  key: string,
  size: number,
  etag: string | null | undefined,
  lastModified: Date | null | undefined,
): StorageObjectItem {
  const relativeKey = key.startsWith(tenantPrefix) ? key.slice(tenantPrefix.length) : key;
  const parts = relativeKey.split('/');
  const fileName = parts.at(-1) ?? relativeKey;
  const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

  return {
    key: relativeKey,
    relative_key: relativeKey,
    file_name: fileName,
    folder,
    size_bytes: size,
    etag: etag ? etag.replaceAll('"', '') : null,
    last_modified: lastModified ? lastModified.toISOString() : null,
  };
}

function decodeBase64Payload(value: string) {
  const raw = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
  return Buffer.from(raw, 'base64');
}

function maskAccessKey(value: string) {
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Unknown MinIO error';
}
