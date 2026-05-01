import { Body, Controller, Delete, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  StorageDownloadUrlResult,
  StorageEnsureBucketResult,
  StorageObjectListResult,
  StorageObjectUploadResult,
  StorageSettings,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ListStorageObjectsDto } from './dto/list-storage-objects.dto';
import { StorageObjectKeyDto } from './dto/storage-object-key.dto';
import { UploadStorageObjectDto } from './dto/upload-storage-object.dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StorageController {
  constructor(@Inject(StorageService) private readonly storageService: StorageService) {}

  @Get('settings')
  @Permissions('storage:object:view')
  @ApiOkResponse({ description: 'Get MinIO storage settings and connection status' })
  async getSettings(): Promise<StorageSettings> {
    return this.storageService.getSettings();
  }

  @Post('ensure-bucket')
  @Permissions('storage:object:manage')
  @ApiOkResponse({ description: 'Create or verify configured MinIO bucket' })
  async ensureBucket(): Promise<StorageEnsureBucketResult> {
    return this.storageService.ensureBucket();
  }

  @Get('objects')
  @Permissions('storage:object:view')
  @ApiOkResponse({ description: 'List tenant-scoped MinIO objects' })
  async listObjects(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListStorageObjectsDto,
  ): Promise<StorageObjectListResult> {
    return this.storageService.listObjects(currentUser, query);
  }

  @Post('objects')
  @Permissions('storage:object:manage')
  @ApiOkResponse({ description: 'Upload tenant-scoped MinIO object' })
  async uploadObject(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UploadStorageObjectDto,
  ): Promise<StorageObjectUploadResult> {
    return this.storageService.uploadObject(currentUser, dto);
  }

  @Delete('objects')
  @Permissions('storage:object:manage')
  @ApiOkResponse({ description: 'Delete tenant-scoped MinIO object' })
  async deleteObject(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: StorageObjectKeyDto,
  ): Promise<{ success: boolean }> {
    return this.storageService.deleteObject(currentUser, query.key);
  }

  @Get('objects/download-url')
  @Permissions('storage:object:view')
  @ApiOkResponse({ description: 'Create short-lived object download URL' })
  async getDownloadUrl(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: StorageObjectKeyDto,
  ): Promise<StorageDownloadUrlResult> {
    return this.storageService.getDownloadUrl(currentUser, query.key);
  }
}
