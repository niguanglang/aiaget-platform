import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  KnowledgeBaseDetail,
  KnowledgeBaseListItem,
  KnowledgeDocumentDetail,
  KnowledgeOverview,
  KnowledgeRetrievalTestResult,
  PaginatedResult,
  RebuildKnowledgeIndexResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireDataScope } from '../common/decorators/data-scope.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { RequireResourceAcl } from '../common/decorators/resource-acl.decorator';
import { DataScopeGuard } from '../common/guards/data-scope.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ResourceAclGuard } from '../common/guards/resource-acl.guard';
import { SecurityPolicyGuard } from '../common/guards/security-policy.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { GetKnowledgeOverviewDto } from './dto/get-knowledge-overview.dto';
import { KnowledgeRetrievalTestDto } from './dto/knowledge-retrieval-test.dto';
import { ListKnowledgeBasesDto } from './dto/list-knowledge-bases.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { UpdateKnowledgeDocumentDto } from './dto/update-knowledge-document.dto';
import { UploadKnowledgeDocumentDto } from './dto/upload-knowledge-document.dto';
import { KnowledgeService } from './knowledge.service';

@ApiTags('knowledge-bases')
@ApiBearerAuth()
@Controller('knowledge-bases')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class KnowledgeController {
  constructor(@Inject(KnowledgeService) private readonly knowledgeService: KnowledgeService) {}

  @Get('overview')
  @Permissions('knowledge:base:view')
  @ApiOkResponse({ description: 'Tenant knowledge governance overview' })
  async overview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() _query: GetKnowledgeOverviewDto,
  ): Promise<KnowledgeOverview> {
    return this.knowledgeService.overview(currentUser);
  }

  @Get()
  @Permissions('knowledge:base:view')
  @ApiOkResponse({ description: 'Tenant-isolated paginated knowledge base list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListKnowledgeBasesDto,
  ): Promise<PaginatedResult<KnowledgeBaseListItem>> {
    return this.knowledgeService.list(currentUser, query);
  }

  @Post()
  @Permissions('knowledge:base:manage')
  @ApiOkResponse({ description: 'Create knowledge base' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateKnowledgeBaseDto,
  ): Promise<KnowledgeBaseDetail> {
    return this.knowledgeService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('knowledge:base:view')
  @RequireDataScope({ resourceType: 'KNOWLEDGE_BASE' })
  @RequireResourceAcl({ resourceType: 'KNOWLEDGE_BASE', permissionCode: 'knowledge:base:view' })
  @ApiOkResponse({ description: 'Get knowledge base detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<KnowledgeBaseDetail> {
    return this.knowledgeService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('knowledge:base:manage')
  @RequireDataScope({ resourceType: 'KNOWLEDGE_BASE' })
  @RequireResourceAcl({ resourceType: 'KNOWLEDGE_BASE', permissionCode: 'knowledge:base:manage' })
  @ApiOkResponse({ description: 'Update knowledge base' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeBaseDto,
  ): Promise<KnowledgeBaseDetail> {
    return this.knowledgeService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('knowledge:base:manage')
  @RequireDataScope({ resourceType: 'KNOWLEDGE_BASE' })
  @RequireResourceAcl({ resourceType: 'KNOWLEDGE_BASE', permissionCode: 'knowledge:base:manage' })
  @ApiOkResponse({ description: 'Soft delete knowledge base' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.knowledgeService.remove(currentUser, id);
  }

  @Post(':id/documents')
  @Permissions('knowledge:base:manage')
  @RequireDataScope({ resourceType: 'KNOWLEDGE_BASE' })
  @RequireResourceAcl({ resourceType: 'KNOWLEDGE_BASE', permissionCode: 'knowledge:base:manage' })
  @ApiOkResponse({ description: 'Upload text or markdown document and enqueue background processing' })
  async uploadDocument(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UploadKnowledgeDocumentDto,
  ): Promise<KnowledgeBaseDetail> {
    return this.knowledgeService.uploadDocument(currentUser, id, dto);
  }

  @Get(':id/documents/:documentId')
  @Permissions('knowledge:base:view')
  @RequireDataScope({ resourceType: 'DOCUMENT', idParam: 'documentId' })
  @RequireResourceAcl({ resourceType: 'DOCUMENT', idParam: 'documentId', permissionCode: 'knowledge:base:view' })
  @ApiOkResponse({ description: 'Get document detail with parsed text, segments, and tasks' })
  async getDocument(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ): Promise<KnowledgeDocumentDetail> {
    return this.knowledgeService.getDocument(currentUser, id, documentId);
  }

  @Patch(':id/documents/:documentId')
  @Permissions('knowledge:base:manage')
  @RequireDataScope({ resourceType: 'DOCUMENT', idParam: 'documentId' })
  @RequireResourceAcl({ resourceType: 'DOCUMENT', idParam: 'documentId', permissionCode: 'knowledge:base:manage' })
  @ApiOkResponse({ description: 'Update document metadata' })
  async updateDocument(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() dto: UpdateKnowledgeDocumentDto,
  ): Promise<KnowledgeBaseDetail> {
    return this.knowledgeService.updateDocument(currentUser, id, documentId, dto);
  }

  @Delete(':id/documents/:documentId')
  @Permissions('knowledge:base:manage')
  @RequireDataScope({ resourceType: 'DOCUMENT', idParam: 'documentId' })
  @RequireResourceAcl({ resourceType: 'DOCUMENT', idParam: 'documentId', permissionCode: 'knowledge:base:manage' })
  @ApiOkResponse({ description: 'Soft delete document and segments' })
  async removeDocument(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ): Promise<KnowledgeBaseDetail> {
    return this.knowledgeService.removeDocument(currentUser, id, documentId);
  }

  @Post(':id/documents/:documentId/reprocess')
  @Permissions('knowledge:base:manage')
  @RequireDataScope({ resourceType: 'DOCUMENT', idParam: 'documentId' })
  @RequireResourceAcl({ resourceType: 'DOCUMENT', idParam: 'documentId', permissionCode: 'knowledge:base:manage' })
  @ApiOkResponse({ description: 'Enqueue document reprocessing into fresh segments' })
  async reprocessDocument(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ): Promise<KnowledgeBaseDetail> {
    return this.knowledgeService.reprocessDocument(currentUser, id, documentId);
  }

  @Post(':id/retrieval-test')
  @Permissions('knowledge:base:manage')
  @RequireDataScope({ resourceType: 'KNOWLEDGE_BASE' })
  @RequireResourceAcl({ resourceType: 'KNOWLEDGE_BASE', permissionCode: 'knowledge:base:manage' })
  @ApiOkResponse({ description: 'Run retrieval test and write recall log' })
  async retrievalTest(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: KnowledgeRetrievalTestDto,
  ): Promise<KnowledgeRetrievalTestResult> {
    return this.knowledgeService.retrievalTest(currentUser, id, dto);
  }

  @Post(':id/rebuild-index')
  @Permissions('knowledge:base:manage')
  @RequireDataScope({ resourceType: 'KNOWLEDGE_BASE' })
  @RequireResourceAcl({ resourceType: 'KNOWLEDGE_BASE', permissionCode: 'knowledge:base:manage' })
  @ApiOkResponse({ description: 'Enqueue vector and keyword index rebuild' })
  async rebuildIndex(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<RebuildKnowledgeIndexResult> {
    return this.knowledgeService.rebuildIndex(currentUser, id);
  }
}
