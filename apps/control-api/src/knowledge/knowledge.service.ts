import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';

import type {
  ConversationReferenceItem,
  KnowledgeAgentReferenceItem,
  KnowledgeBaseDetail,
  KnowledgeBaseListItem,
  KnowledgeDocumentDetail,
  KnowledgeDocumentListItem,
  KnowledgeOwnerSummary,
  KnowledgeOverview,
  KnowledgeOverviewDocumentItem,
  KnowledgeOverviewRecallItem,
  KnowledgeOverviewTaskItem,
  KnowledgeRecallLogItem,
  KnowledgeRecallResultItem,
  KnowledgeRetrievalTestResult,
  KnowledgeSegmentItem,
  KnowledgeTaskItem,
  PaginatedResult,
  RebuildKnowledgeIndexResult,
} from '@aiaget/shared-types';

import type { TraceContext } from '../common/tracing/trace-context';
import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { decryptSecret } from '../models/model-secrets';
import { executeOpenAiCompatibleEmbeddings } from '../models/openai-compatible-client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import type { KnowledgeRetrievalTestDto } from './dto/knowledge-retrieval-test.dto';
import type { ListKnowledgeBasesDto } from './dto/list-knowledge-bases.dto';
import { KnowledgeTaskDispatcherService } from './knowledge-task-dispatcher.service';
import { OpenSearchService, type OpenSearchWriteResult } from './opensearch.service';
import { QdrantService, type QdrantWriteResult } from './qdrant.service';
import type { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import type { UpdateKnowledgeDocumentDto } from './dto/update-knowledge-document.dto';
import type { UploadKnowledgeDocumentDto } from './dto/upload-knowledge-document.dto';

const baseInclude = {
  owner: true,
  documents: {
    where: {
      deletedAt: null,
    },
    include: {
      uploader: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  },
  segments: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    take: 80,
  },
  tasks: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  },
  recallLogs: {
    include: {
      operator: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  },
} satisfies Prisma.KnowledgeBaseInclude;

const documentInclude = {
  uploader: true,
  segments: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
  tasks: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  },
} satisfies Prisma.KnowledgeDocumentInclude;

type KnowledgeBaseRecord = Prisma.KnowledgeBaseGetPayload<{ include: typeof baseInclude }>;
type KnowledgeDocumentRecord = Prisma.KnowledgeDocumentGetPayload<{ include: typeof documentInclude }>;
type SegmentWithDocument = Prisma.KnowledgeSegmentGetPayload<{ include: { document: true } }>;
type ScoredSegment = SegmentWithDocument & { score: number; keywordScore: number; vectorScore: number };

interface EmbeddingContext {
  model: string;
  apiKey: string;
  baseUrl: string;
}

@Injectable()
export class KnowledgeService implements OnModuleInit {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storageService: StorageService,
    @Inject(KnowledgeTaskDispatcherService) private readonly taskDispatcher: KnowledgeTaskDispatcherService,
    @Inject(OpenSearchService) private readonly openSearchService: OpenSearchService,
    @Inject(QdrantService) private readonly qdrantService: QdrantService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
  ) {}

  onModuleInit() {
    this.taskDispatcher.registerRunner((taskId) => this.executeQueuedTask(taskId));
    void this.taskDispatcher.recoverRunnableTasks();
  }

  async runWorkflowTask(taskId: string) {
    await this.executeQueuedTask(taskId);
    return { success: true, task_id: taskId };
  }

  async overview(currentUser: AuthenticatedUser): Promise<KnowledgeOverview> {
    const since24h = new Date();
    since24h.setHours(since24h.getHours() - 24);
    const activeKnowledgeBases = await this.prisma.knowledgeBase.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    const activeKnowledgeBaseIds = activeKnowledgeBases.map((item) => item.id);

    const [
      knowledgeBaseCount,
      activeKnowledgeBaseCount,
      documentCount,
      processingDocumentCount,
      segmentCount,
      activeTaskCount,
      failedTaskCount,
      agentReferenceCount,
      recallLogCount24h,
      recallSuccessCount24h,
      vectorReadySegmentCount,
      keywordReadySegmentCount,
      recentDocuments,
      recentTasks,
      recentRecallLogs,
    ] = await this.prisma.$transaction([
      this.prisma.knowledgeBase.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
      }),
      this.prisma.knowledgeBase.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
      this.prisma.knowledgeDocument.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
      }),
      this.prisma.knowledgeDocument.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          status: 'PROCESSING',
        },
      }),
      this.prisma.knowledgeSegment.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
      }),
      this.prisma.knowledgeEmbeddingTask.count({
        where: {
          tenantId: currentUser.tenantId,
          knowledge: {
            deletedAt: null,
          },
          status: {
            in: ['PENDING', 'RUNNING'],
          },
        },
      }),
      this.prisma.knowledgeEmbeddingTask.count({
        where: {
          tenantId: currentUser.tenantId,
          knowledge: {
            deletedAt: null,
          },
          status: 'FAILED',
        },
      }),
      this.prisma.agentKnowledgeBinding.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          knowledgeId: {
            in: activeKnowledgeBaseIds,
          },
        },
      }),
      this.prisma.knowledgeRecallLog.count({
        where: {
          tenantId: currentUser.tenantId,
          knowledge: {
            deletedAt: null,
          },
          createdAt: {
            gte: since24h,
          },
        },
      }),
      this.prisma.knowledgeRecallLog.count({
        where: {
          tenantId: currentUser.tenantId,
          knowledge: {
            deletedAt: null,
          },
          createdAt: {
            gte: since24h,
          },
          status: 'SUCCESS',
        },
      }),
      this.prisma.knowledgeSegment.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          vectorStatus: 'READY',
          knowledge: {
            deletedAt: null,
          },
        },
      }),
      this.prisma.knowledgeSegment.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          indexStatus: 'READY',
          knowledge: {
            deletedAt: null,
          },
        },
      }),
      this.prisma.knowledgeDocument.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          knowledge: {
            deletedAt: null,
          },
        },
        include: {
          knowledge: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 6,
      }),
      this.prisma.knowledgeEmbeddingTask.findMany({
        where: {
          tenantId: currentUser.tenantId,
          knowledge: {
            deletedAt: null,
          },
        },
        include: {
          knowledge: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 6,
      }),
      this.prisma.knowledgeRecallLog.findMany({
        where: {
          tenantId: currentUser.tenantId,
          knowledge: {
            deletedAt: null,
          },
        },
        include: {
          knowledge: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      }),
    ]);

    const totalSegmentCount = Math.max(segmentCount, 1);

    return {
      generated_at: new Date().toISOString(),
      summary: {
        knowledge_base_count: knowledgeBaseCount,
        active_knowledge_base_count: activeKnowledgeBaseCount,
        document_count: documentCount,
        processing_document_count: processingDocumentCount,
        segment_count: segmentCount,
        active_task_count: activeTaskCount,
        failed_task_count: failedTaskCount,
        agent_reference_count: agentReferenceCount,
        recall_log_count_24h: recallLogCount24h,
        recall_success_count_24h: recallSuccessCount24h,
        recall_success_rate_24h: recallLogCount24h === 0 ? 0 : Number(((recallSuccessCount24h / recallLogCount24h) * 100).toFixed(1)),
        vector_ready_segment_count: vectorReadySegmentCount,
        keyword_ready_segment_count: keywordReadySegmentCount,
        vector_ready_rate: Number(((vectorReadySegmentCount / totalSegmentCount) * 100).toFixed(1)),
        keyword_ready_rate: Number(((keywordReadySegmentCount / totalSegmentCount) * 100).toFixed(1)),
      },
      recent_documents: recentDocuments.map((document) => this.mapOverviewDocument(document)),
      recent_tasks: recentTasks.map((task) => this.mapOverviewTask(task)),
      recent_recall_logs: recentRecallLogs.map((log) => this.mapOverviewRecall(log)),
    };
  }

  async retrieveAgentReferences(
    currentUser: AuthenticatedUser,
    agentId: string,
    query: string,
    traceContext?: TraceContext,
  ): Promise<{
    references: ConversationReferenceItem[];
    mode: 'HYBRID';
    latency_ms: number;
    cost_total: number;
  }> {
    const bindings = await this.prisma.agentKnowledgeBinding.findMany({
      where: {
        tenantId: currentUser.tenantId,
        agentId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (bindings.length === 0) {
      return {
        references: [],
        mode: 'HYBRID',
        latency_ms: 0,
        cost_total: 0,
      };
    }

    const activeKnowledgeBases = await this.prisma.knowledgeBase.findMany({
      where: {
        tenantId: currentUser.tenantId,
        id: {
          in: bindings.map((binding) => binding.knowledgeId),
        },
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });
    const activeKnowledgeIds = new Set(activeKnowledgeBases.map((knowledgeBase) => knowledgeBase.id));

    if (activeKnowledgeIds.size === 0) {
      return {
        references: [],
        mode: 'HYBRID',
        latency_ms: 0,
        cost_total: 0,
      };
    }

    const references: Array<{
      segment: ScoredSegment;
      reference: ConversationReferenceItem;
      weighted_score: number;
    }> = [];
    const mode = 'HYBRID';
    const normalizedQuery = query.trim();
    const startedAt = Date.now();

    for (const binding of bindings) {
      if (!activeKnowledgeIds.has(binding.knowledgeId)) continue;

      const segments = await this.prisma.knowledgeSegment.findMany({
        where: {
          tenantId: currentUser.tenantId,
          knowledgeId: binding.knowledgeId,
          deletedAt: null,
          knowledge: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        },
        include: {
          document: true,
        },
        orderBy: [{ documentId: 'asc' }, { sortOrder: 'asc' }],
      });

      const scored = (await scoreSegments(
        this.openSearchService,
        this.qdrantService,
        this.prisma,
        currentUser.tenantId,
        binding.knowledgeId,
        normalizedQuery,
        segments,
        mode,
        binding.recallTopK,
      ))
        .slice(0, binding.recallTopK)
        .map((segment) => ({
          segment,
          reference: this.mapConversationReference(segment),
          weighted_score: Number((segment.score * (binding.weight / 100)).toFixed(3)),
        }));

      await this.prisma.knowledgeRecallLog.create({
        data: {
          tenantId: currentUser.tenantId,
          knowledgeId: binding.knowledgeId,
          query: normalizedQuery,
          mode,
          topK: binding.recallTopK,
          status: 'SUCCESS',
          latencyMs: Math.max(1, 18 + scored.length * 4),
          resultCount: scored.length,
          results: scored.map(({ weighted_score, segment }) => ({
            trace_id: traceContext?.traceId ?? null,
            span_id: traceContext?.spanId ?? null,
            traceparent: traceContext?.traceparent ?? null,
            segment_id: segment.id,
            document_id: segment.documentId,
            document_title: segment.document.title,
            content: segment.content,
            score: weighted_score,
            keyword_score: segment.keywordScore,
            vector_score: segment.vectorScore,
            keywords: segment.keywords,
            source_type: segment.document.sourceType,
          })) as unknown as Prisma.InputJsonArray,
          createdBy: currentUser.id,
        },
      });

      references.push(...scored);
    }

    return {
      references: references
        .sort((left, right) => right.weighted_score - left.weighted_score)
        .slice(0, 6)
        .map(({ weighted_score, reference }) => ({
          ...reference,
          score: weighted_score,
        })),
      mode,
      latency_ms: Math.max(1, Date.now() - startedAt),
      cost_total: 0,
    };
  }

  async list(
    currentUser: AuthenticatedUser,
    query: ListKnowledgeBasesDto,
  ): Promise<PaginatedResult<KnowledgeBaseListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.KnowledgeBaseWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.visibility) where.visibility = query.visibility;
    if (query.owner_id) where.ownerId = query.owner_id;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const dataScope = await this.dataScopeQuery.buildWhere<Prisma.KnowledgeBaseWhereInput>(currentUser, 'KNOWLEDGE_BASE');
    mergeDataScopeWhere(where, dataScope.where);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.knowledgeBase.findMany({
        where,
        include: baseInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.knowledgeBase.count({ where }),
    ]);
    const referenceCounts = await this.getAgentReferenceCounts(
      currentUser.tenantId,
      items.map((item) => item.id),
    );

    return {
      items: items.map((item) => this.mapListItem(item, referenceCounts.get(item.id) ?? 0)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateKnowledgeBaseDto): Promise<KnowledgeBaseDetail> {
    await this.validateOwner(currentUser.tenantId, dto.owner_id);

    try {
      const created = await this.prisma.knowledgeBase.create({
        data: {
          tenantId: currentUser.tenantId,
          name: dto.name.trim(),
          code: dto.code.trim(),
          visibility: dto.visibility ?? 'PRIVATE',
          description: dto.description?.trim() || null,
          ownerId: dto.owner_id || currentUser.id,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: baseInclude,
      });

      return this.mapDetail(created, []);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A knowledge base with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<KnowledgeBaseDetail> {
    const base = await this.findBase(currentUser.tenantId, id);
    const references = await this.getAgentReferences(currentUser.tenantId, id);

    return this.mapDetail(base, references);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateKnowledgeBaseDto,
  ): Promise<KnowledgeBaseDetail> {
    await this.ensureBase(currentUser.tenantId, id);
    await this.validateOwner(currentUser.tenantId, dto.owner_id);
    const data: Prisma.KnowledgeBaseUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.visibility !== undefined) data.visibility = dto.visibility;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.owner_id !== undefined) {
      data.owner = dto.owner_id ? { connect: { id: dto.owner_id } } : { disconnect: true };
    }

    await this.prisma.knowledgeBase.update({
      where: { id },
      data,
    });

    return this.get(currentUser, id);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    await this.ensureBase(currentUser.tenantId, id);

    await this.prisma.knowledgeBase.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async uploadDocument(
    currentUser: AuthenticatedUser,
    knowledgeId: string,
    dto: UploadKnowledgeDocumentDto,
  ): Promise<KnowledgeBaseDetail> {
    await this.ensureBase(currentUser.tenantId, knowledgeId);
    this.ensureSupportedTextSource(dto.source_type);
    const normalizedContent = dto.content.replace(/\r\n/g, '\n').trim();

    if (!normalizedContent) {
      throw new BadRequestException('Document content is required');
    }

    const checksum = createHash('sha256').update(normalizedContent).digest('hex');
    const fileName = dto.file_name?.trim() || buildKnowledgeFileName(dto.title, dto.source_type, checksum);
    const mimeType = dto.mime_type?.trim() || defaultMimeType(dto.source_type);
    const storageObject = await this.storageService.uploadObject(currentUser, {
      content_base64: Buffer.from(normalizedContent, 'utf8').toString('base64'),
      content_type: mimeType,
      file_name: fileName,
      folder: `knowledge/${knowledgeId}`,
    });
    const created = await this.prisma.knowledgeDocument.create({
      data: {
        tenantId: currentUser.tenantId,
        knowledgeId,
        title: dto.title.trim(),
        sourceType: dto.source_type,
        mimeType,
        fileName,
        fileSize: Buffer.byteLength(normalizedContent, 'utf8'),
        storagePath: buildMinioStoragePath(currentUser.tenantId, storageObject.item.relative_key),
        checksum,
        status: 'PROCESSING',
        parsedText: normalizedContent,
        uploadedBy: currentUser.id,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
    });
    const task = await this.prisma.knowledgeEmbeddingTask.create({
      data: {
        tenantId: currentUser.tenantId,
        knowledgeId,
        documentId: created.id,
        taskType: 'PROCESS',
        status: 'PENDING',
        totalItems: chunkText(normalizedContent).length,
        processedItems: 0,
      },
    });
    const result = await this.get(currentUser, knowledgeId);

    this.taskDispatcher.enqueue(task.id);

    return result;
  }

  async getDocument(
    currentUser: AuthenticatedUser,
    knowledgeId: string,
    documentId: string,
  ): Promise<KnowledgeDocumentDetail> {
    await this.ensureBase(currentUser.tenantId, knowledgeId);
    const document = await this.findDocument(currentUser.tenantId, knowledgeId, documentId);

    return this.mapDocumentDetail(document);
  }

  async updateDocument(
    currentUser: AuthenticatedUser,
    knowledgeId: string,
    documentId: string,
    dto: UpdateKnowledgeDocumentDto,
  ): Promise<KnowledgeBaseDetail> {
    await this.ensureDocument(currentUser.tenantId, knowledgeId, documentId);
    const data: Prisma.KnowledgeDocumentUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.status !== undefined) data.status = dto.status;

    await this.prisma.knowledgeDocument.update({
      where: { id: documentId },
      data,
    });

    return this.get(currentUser, knowledgeId);
  }

  async removeDocument(
    currentUser: AuthenticatedUser,
    knowledgeId: string,
    documentId: string,
  ): Promise<KnowledgeBaseDetail> {
    await this.ensureDocument(currentUser.tenantId, knowledgeId, documentId);
    const existingSegments = await this.prisma.knowledgeSegment.findMany({
      where: {
        tenantId: currentUser.tenantId,
        knowledgeId,
        documentId,
        deletedAt: null,
      },
      select: {
        embeddingVector: true,
      },
    });

    await this.qdrantService.deleteDocumentSegments({
      tenantId: currentUser.tenantId,
      knowledgeId,
      documentId,
      vectorSizes: existingSegments.map((segment) => parseEmbeddingVector(segment.embeddingVector).length),
    });
    await this.openSearchService.deleteDocumentSegments({
      tenantId: currentUser.tenantId,
      knowledgeId,
      documentId,
    });

    await this.prisma.$transaction([
      this.prisma.knowledgeSegment.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          knowledgeId,
          documentId,
        },
        data: {
          deletedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
    ]);

    return this.get(currentUser, knowledgeId);
  }

  async reprocessDocument(
    currentUser: AuthenticatedUser,
    knowledgeId: string,
    documentId: string,
  ): Promise<KnowledgeBaseDetail> {
    const document = await this.ensureDocument(currentUser.tenantId, knowledgeId, documentId);

    if (!document.parsedText) {
      throw new BadRequestException('Document has no parsed text to reprocess');
    }

    await this.ensureNoActiveDocumentTask(currentUser.tenantId, knowledgeId, documentId);

    const task = await this.prisma.knowledgeEmbeddingTask.create({
      data: {
        tenantId: currentUser.tenantId,
        knowledgeId,
        documentId,
        taskType: 'PROCESS',
        status: 'PENDING',
        totalItems: chunkText(document.parsedText).length,
        processedItems: 0,
      },
    });
    await this.prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: 'PROCESSING',
        errorMessage: null,
        updatedBy: currentUser.id,
      },
    });
    const result = await this.get(currentUser, knowledgeId);

    this.taskDispatcher.enqueue(task.id);

    return result;
  }

  async rebuildIndex(
    currentUser: AuthenticatedUser,
    knowledgeId: string,
  ): Promise<RebuildKnowledgeIndexResult> {
    await this.ensureBase(currentUser.tenantId, knowledgeId);
    await this.ensureNoActiveRebuildTask(currentUser.tenantId, knowledgeId);
    const segmentIds = await this.prisma.knowledgeSegment.findMany({
      where: {
        tenantId: currentUser.tenantId,
        knowledgeId,
        deletedAt: null,
      },
      select: { id: true },
    });
    const task = await this.prisma.knowledgeEmbeddingTask.create({
      data: {
        tenantId: currentUser.tenantId,
        knowledgeId,
        taskType: 'REBUILD',
        status: 'PENDING',
        totalItems: segmentIds.length,
        processedItems: 0,
      },
    });

    this.taskDispatcher.enqueue(task.id);

    return {
      success: true,
      task_id: task.id,
      processed_segments: 0,
      queued: true,
      status: 'PENDING',
    };
  }

  private async executeRebuildTask(
    task: Prisma.KnowledgeEmbeddingTaskGetPayload<object>,
  ): Promise<number> {
    const now = new Date();
    await this.prisma.knowledgeEmbeddingTask.update({
      where: { id: task.id },
      data: {
        status: 'RUNNING',
        startedAt: task.startedAt ?? now,
        endedAt: null,
        errorMessage: null,
      },
    });

    const segments = await this.prisma.knowledgeSegment.findMany({
      where: {
        tenantId: task.tenantId,
        knowledgeId: task.knowledgeId,
        deletedAt: null,
      },
      include: {
        document: true,
      },
      orderBy: [{ documentId: 'asc' }, { sortOrder: 'asc' }],
    });
    const embeddings = await buildEmbeddings(this.prisma, task.tenantId, segments.map((segment) => segment.content));
    const updates = segments.map((segment, index) =>
      this.prisma.knowledgeSegment.update({
        where: { id: segment.id },
        data: {
          embeddingVector: embeddings.vectors[index] ?? [],
          embeddingModel: embeddings.model,
          vectorStatus: 'READY',
          indexStatus: 'READY',
          metadata: buildVectorMetadata(segment.metadata, {
            backend: 'POSTGRES_FALLBACK',
            collection: null,
            errorMessage: null,
            indexedCount: 0,
            source: embeddings.source,
          }),
        },
      }),
    );

    await this.prisma.$transaction([
      ...updates,
      this.prisma.knowledgeEmbeddingTask.update({
        where: { id: task.id },
        data: {
          processedItems: segments.length,
          totalItems: segments.length,
        },
      }),
    ]);
    const qdrantResult = await this.qdrantService.upsertSegments(
      segments.map((segment, index) => ({
        id: segment.id,
        tenantId: task.tenantId,
        knowledgeId: task.knowledgeId,
        documentId: segment.documentId,
        title: segment.document.title,
        sourceType: segment.document.sourceType,
        content: segment.content,
        keywords: segment.keywords,
        tokenCount: segment.tokenCount,
        sortOrder: segment.sortOrder,
        embeddingModel: embeddings.model,
        vector: embeddings.vectors[index] ?? [],
      })),
    );
    const openSearchResult = await this.openSearchService.indexSegments(
      segments.map((segment) => ({
        id: segment.id,
        tenantId: task.tenantId,
        knowledgeId: task.knowledgeId,
        documentId: segment.documentId,
        title: segment.document.title,
        sourceType: segment.document.sourceType,
        content: segment.content,
        keywords: segment.keywords,
        tokenCount: segment.tokenCount,
        sortOrder: segment.sortOrder,
        storagePath: segment.document.storagePath,
      })),
    );

    await this.updateSegmentVectorMetadata(
      segments.map((segment) => ({
        id: segment.id,
        metadata: segment.metadata,
      })),
      embeddings.source,
      qdrantResult,
    );
    await this.updateSegmentKeywordMetadata(
      segments.map((segment) => segment.id),
      openSearchResult,
    );

    return segments.length;
  }

  async retrievalTest(
    currentUser: AuthenticatedUser,
    knowledgeId: string,
    dto: KnowledgeRetrievalTestDto,
  ): Promise<KnowledgeRetrievalTestResult> {
    const startedAt = Date.now();
    await this.ensureBase(currentUser.tenantId, knowledgeId);
    const query = dto.query.trim();
    const mode = (dto.mode ?? 'HYBRID') as 'VECTOR' | 'KEYWORD' | 'HYBRID';
    const topK = Number(dto.top_k ?? 5);
    const segments = await this.prisma.knowledgeSegment.findMany({
      where: {
        tenantId: currentUser.tenantId,
        knowledgeId,
        deletedAt: null,
      },
      include: {
        document: true,
      },
      orderBy: [{ documentId: 'asc' }, { sortOrder: 'asc' }],
    });
    const results = (await scoreSegments(
      this.openSearchService,
      this.qdrantService,
      this.prisma,
      currentUser.tenantId,
      knowledgeId,
      query,
      segments,
      mode,
      topK,
    ))
      .slice(0, topK)
      .map((segment) => this.mapRecallResult(segment));
    const tracePayload = buildRecallTracePayload(currentUser);
    const loggedResults = results.map((result) => ({
      ...tracePayload,
      ...result,
    }));
    const status = 'SUCCESS';
    const recallLog = await this.prisma.knowledgeRecallLog.create({
      data: {
        tenantId: currentUser.tenantId,
        knowledgeId,
        query,
        mode,
        topK,
        status,
        latencyMs: Date.now() - startedAt + 35,
        resultCount: results.length,
        results: loggedResults as unknown as Prisma.InputJsonArray,
        createdBy: currentUser.id,
      },
    });

    return {
      id: recallLog.id,
      query,
      mode: mode as KnowledgeRetrievalTestResult['mode'],
      top_k: topK,
      status,
      latency_ms: recallLog.latencyMs,
      results,
      error_message: null,
    };
  }

  private async executeQueuedTask(taskId: string) {
    const task = await this.prisma.knowledgeEmbeddingTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.status === 'SUCCESS' || task.status === 'FAILED') {
      return;
    }

    try {
      const processedItems = task.taskType === 'PROCESS'
        ? await this.executeDocumentProcessingTask(task)
        : task.taskType === 'REBUILD'
          ? await this.executeRebuildTask(task)
          : await this.failUnsupportedTaskType(task);

      await this.prisma.knowledgeEmbeddingTask.update({
        where: { id: task.id },
        data: {
          status: 'SUCCESS',
          processedItems,
          totalItems: processedItems,
          endedAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (error) {
      await this.markQueuedTaskFailed(task, error);
      throw error;
    }
  }

  private async executeDocumentProcessingTask(
    task: Prisma.KnowledgeEmbeddingTaskGetPayload<object>,
  ): Promise<number> {
    if (!task.documentId) {
      throw new BadRequestException('Document processing task requires a document id');
    }

    const documentId = task.documentId;
    const now = new Date();
    const document = await this.prisma.knowledgeDocument.findFirst({
      where: {
        id: documentId,
        tenantId: task.tenantId,
        knowledgeId: task.knowledgeId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundException('Knowledge document not found');
    }

    if (!document.parsedText) {
      throw new BadRequestException('Document has no parsed text to process');
    }

    await this.prisma.$transaction([
      this.prisma.knowledgeEmbeddingTask.update({
        where: { id: task.id },
        data: {
          status: 'RUNNING',
          startedAt: task.startedAt ?? now,
          endedAt: null,
          errorMessage: null,
        },
      }),
      this.prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
          status: 'PROCESSING',
          errorMessage: null,
        },
      }),
    ]);

    const existingSegments = await this.prisma.knowledgeSegment.findMany({
      where: {
        tenantId: task.tenantId,
        knowledgeId: task.knowledgeId,
        documentId,
      },
      select: {
        embeddingVector: true,
      },
    });
    const content = document.parsedText;
    const chunks = chunkText(content);
    const embeddings = await buildEmbeddings(this.prisma, task.tenantId, chunks);
    const segmentRows = chunks.map((chunk, index) => {
      const keywords = extractKeywords(chunk);
      const tokenCount = estimateTokens(chunk);
      const vector = embeddings.vectors[index] ?? [];

      return {
        id: randomUUID(),
        content: chunk,
        keywords,
        tokenCount,
        vector,
        sortOrder: index,
        metadata: {
          parser: 'sync-text-v1',
          chunk_index: index,
          storage_boundary: 'minio-original-postgres-parsed',
          retrieval_profile: embeddings.source,
          vector_backend: 'POSTGRES_FALLBACK',
          qdrant_collection: null,
          qdrant_error: null,
          keyword_backend: 'POSTGRES_FALLBACK',
          opensearch_index: null,
          opensearch_error: null,
        },
      };
    });
    const operatorId = document.updatedBy ?? document.createdBy ?? document.uploadedBy;

    await this.qdrantService.deleteDocumentSegments({
      tenantId: task.tenantId,
      knowledgeId: task.knowledgeId,
      documentId,
      vectorSizes: existingSegments.map((segment) => parseEmbeddingVector(segment.embeddingVector).length),
    });
    await this.openSearchService.deleteDocumentSegments({
      tenantId: task.tenantId,
      knowledgeId: task.knowledgeId,
      documentId,
    });

    await this.prisma.$transaction([
      this.prisma.knowledgeSegment.deleteMany({
        where: {
          tenantId: task.tenantId,
          knowledgeId: task.knowledgeId,
          documentId,
        },
      }),
      this.prisma.knowledgeSegment.createMany({
        data: segmentRows.map((segment) => ({
          id: segment.id,
          tenantId: task.tenantId,
          knowledgeId: task.knowledgeId,
          documentId,
          content: segment.content,
          tokenCount: segment.tokenCount,
          keywords: segment.keywords,
          embeddingVector: segment.vector,
          embeddingModel: embeddings.model,
          metadata: segment.metadata,
          vectorStatus: 'READY',
          indexStatus: 'READY',
          sortOrder: segment.sortOrder,
          createdBy: operatorId,
          updatedBy: operatorId,
        })),
      }),
      this.prisma.knowledgeEmbeddingTask.update({
        where: { id: task.id },
        data: {
          totalItems: segmentRows.length,
          processedItems: segmentRows.length,
        },
      }),
    ]);
    const qdrantResult = await this.qdrantService.upsertSegments(
      segmentRows.map((segment) => ({
        id: segment.id,
        tenantId: task.tenantId,
        knowledgeId: task.knowledgeId,
        documentId,
        title: document.title,
        sourceType: document.sourceType,
        content: segment.content,
        keywords: segment.keywords,
        tokenCount: segment.tokenCount,
        sortOrder: segment.sortOrder,
        embeddingModel: embeddings.model,
        vector: segment.vector,
      })),
    );
    const openSearchResult = await this.openSearchService.indexSegments(
      segmentRows.map((segment) => ({
        id: segment.id,
        tenantId: task.tenantId,
        knowledgeId: task.knowledgeId,
        documentId,
        title: document.title,
        sourceType: document.sourceType,
        content: segment.content,
        keywords: segment.keywords,
        tokenCount: segment.tokenCount,
        sortOrder: segment.sortOrder,
        storagePath: document.storagePath,
      })),
    );

    await this.updateSegmentVectorMetadata(
      segmentRows.map((segment) => ({
        id: segment.id,
        metadata: segment.metadata,
      })),
      embeddings.source,
      qdrantResult,
    );
    await this.updateSegmentKeywordMetadata(
      segmentRows.map((segment) => segment.id),
      openSearchResult,
    );
    await this.prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: {
        status: 'READY',
        segmentCount: segmentRows.length,
        tokenCount: segmentRows.reduce((sum, segment) => sum + segment.tokenCount, 0),
        errorMessage: null,
        updatedBy: operatorId,
      },
    });

    return segmentRows.length;
  }

  private async failUnsupportedTaskType(
    task: Prisma.KnowledgeEmbeddingTaskGetPayload<object>,
  ): Promise<never> {
    throw new BadRequestException(`Unsupported knowledge task type: ${task.taskType}`);
  }

  private async markQueuedTaskFailed(
    task: Prisma.KnowledgeEmbeddingTaskGetPayload<object>,
    error: unknown,
  ) {
    const message = error instanceof Error ? error.message : 'Knowledge processing task failed';
    const updates: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.knowledgeEmbeddingTask.update({
        where: { id: task.id },
        data: {
          status: 'FAILED',
          errorMessage: message,
          endedAt: new Date(),
        },
      }),
    ];

    if (task.documentId) {
      updates.push(
        this.prisma.knowledgeDocument.updateMany({
          where: {
            id: task.documentId,
            tenantId: task.tenantId,
            knowledgeId: task.knowledgeId,
            deletedAt: null,
          },
          data: {
            status: 'FAILED',
            errorMessage: message,
          },
        }),
      );
    }

    await this.prisma.$transaction(updates);
  }

  private async updateSegmentVectorMetadata(
    segments: Array<{ id: string; metadata: Prisma.JsonValue | null }>,
    source: string,
    qdrantResult: QdrantWriteResult,
  ) {
    if (segments.length === 0) return;

    await this.prisma.$transaction(
      segments.map((segment) =>
        this.prisma.knowledgeSegment.update({
          where: { id: segment.id },
          data: {
            metadata: buildVectorMetadata(segment.metadata, {
              backend: qdrantResult.backend,
              collection: qdrantResult.collection,
              errorMessage: qdrantResult.error_message,
              indexedCount: qdrantResult.indexed_count,
              source,
            }),
          },
        }),
      ),
    );
  }

  private async updateSegmentKeywordMetadata(
    segmentIds: string[],
    openSearchResult: OpenSearchWriteResult,
  ) {
    if (segmentIds.length === 0) return;

    const segments = await this.prisma.knowledgeSegment.findMany({
      where: {
        id: {
          in: segmentIds,
        },
      },
      select: {
        id: true,
        metadata: true,
      },
    });

    await this.prisma.$transaction(
      segments.map((segment) =>
        this.prisma.knowledgeSegment.update({
          where: { id: segment.id },
          data: {
            metadata: buildKeywordMetadata(segment.metadata, openSearchResult),
          },
        }),
      ),
    );
  }

  private ensureSupportedTextSource(sourceType: string) {
    if (!['TEXT', 'MARKDOWN', 'HTML', 'FAQ'].includes(sourceType)) {
      throw new BadRequestException('M06 first implementation supports TEXT, MARKDOWN, HTML, and FAQ content upload');
    }
  }

  private async findBase(tenantId: string, id: string): Promise<KnowledgeBaseRecord> {
    const base = await this.prisma.knowledgeBase.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: baseInclude,
    });

    if (!base) {
      throw new NotFoundException('Knowledge base not found');
    }

    return base;
  }

  private async ensureBase(tenantId: string, id: string) {
    const base = await this.prisma.knowledgeBase.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!base) {
      throw new NotFoundException('Knowledge base not found');
    }

    return base;
  }

  private async ensureNoActiveDocumentTask(
    tenantId: string,
    knowledgeId: string,
    documentId: string,
  ) {
    const activeTask = await this.prisma.knowledgeEmbeddingTask.findFirst({
      where: {
        tenantId,
        knowledgeId,
        documentId,
        taskType: 'PROCESS',
        status: {
          in: ['PENDING', 'RUNNING'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (activeTask) {
      throw new BadRequestException('文档已有后台处理任务，请稍后再试');
    }
  }

  private async ensureNoActiveRebuildTask(
    tenantId: string,
    knowledgeId: string,
  ) {
    const activeTask = await this.prisma.knowledgeEmbeddingTask.findFirst({
      where: {
        tenantId,
        knowledgeId,
        documentId: null,
        taskType: 'REBUILD',
        status: {
          in: ['PENDING', 'RUNNING'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (activeTask) {
      throw new BadRequestException('知识库已有后台重建任务，请稍后再试');
    }
  }

  private async findDocument(
    tenantId: string,
    knowledgeId: string,
    documentId: string,
  ): Promise<KnowledgeDocumentRecord> {
    const document = await this.prisma.knowledgeDocument.findFirst({
      where: {
        id: documentId,
        tenantId,
        knowledgeId,
        deletedAt: null,
      },
      include: documentInclude,
    });

    if (!document) {
      throw new NotFoundException('Knowledge document not found');
    }

    return document;
  }

  private async ensureDocument(tenantId: string, knowledgeId: string, documentId: string) {
    const document = await this.prisma.knowledgeDocument.findFirst({
      where: {
        id: documentId,
        tenantId,
        knowledgeId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new NotFoundException('Knowledge document not found');
    }

    return document;
  }

  private async validateOwner(tenantId: string, ownerId?: string | null) {
    if (!ownerId) return;

    const owner = await this.prisma.user.findFirst({
      where: {
        id: ownerId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!owner) {
      throw new BadRequestException('Knowledge owner does not exist in this tenant');
    }
  }

  private async getAgentReferenceCounts(tenantId: string, knowledgeIds: string[]) {
    const counts = new Map<string, number>();

    if (knowledgeIds.length === 0) return counts;

    const references = await this.prisma.agentKnowledgeBinding.groupBy({
      by: ['knowledgeId'],
      where: {
        tenantId,
        knowledgeId: {
          in: knowledgeIds,
        },
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    });

    references.forEach((reference) => counts.set(reference.knowledgeId, reference._count._all));

    return counts;
  }

  private async getAgentReferences(tenantId: string, knowledgeId: string): Promise<KnowledgeAgentReferenceItem[]> {
    const references = await this.prisma.agentKnowledgeBinding.findMany({
      where: {
        tenantId,
        knowledgeId,
        deletedAt: null,
      },
      include: {
        agent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return references.map((reference) => ({
      id: reference.id,
      agent_id: reference.agentId,
      agent_name: reference.agent.name,
      agent_code: reference.agent.code,
      weight: reference.weight,
      recall_top_k: reference.recallTopK,
      created_at: reference.createdAt.toISOString(),
    }));
  }

  private mapListItem(base: KnowledgeBaseRecord, agentReferenceCount: number): KnowledgeBaseListItem {
    return {
      id: base.id,
      tenant_id: base.tenantId,
      name: base.name,
      code: base.code,
      visibility: base.visibility as KnowledgeBaseListItem['visibility'],
      status: base.status as KnowledgeBaseListItem['status'],
      description: base.description,
      owner: base.owner ? this.mapOwner(base.owner) : null,
      document_count: base.documents.length,
      segment_count: base.documents.reduce((sum, document) => sum + document.segmentCount, 0),
      failed_task_count: base.tasks.filter((task) => task.status === 'FAILED').length,
      recall_count: base.recallLogs.length,
      agent_reference_count: agentReferenceCount,
      created_at: base.createdAt.toISOString(),
      updated_at: base.updatedAt.toISOString(),
    };
  }

  private mapDetail(base: KnowledgeBaseRecord, references: KnowledgeAgentReferenceItem[]): KnowledgeBaseDetail {
    return {
      ...this.mapListItem(base, references.length),
      documents: base.documents.map((document) => this.mapDocumentListItem(document)),
      segments: base.segments.map((segment) => this.mapSegment(segment)),
      tasks: base.tasks.map((task) => this.mapTask(task)),
      recall_logs: base.recallLogs.map((log) => this.mapRecallLog(log)),
      agent_references: references,
    };
  }

  private mapDocumentDetail(document: KnowledgeDocumentRecord): KnowledgeDocumentDetail {
    return {
      ...this.mapDocumentListItem(document),
      parsed_text: document.parsedText,
      segments: document.segments.map((segment) => this.mapSegment(segment)),
      tasks: document.tasks.map((task) => this.mapTask(task)),
    };
  }

  private mapOwner(owner: { id: string; name: string; email: string }): KnowledgeOwnerSummary {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
    };
  }

  private mapDocumentListItem(
    document: Prisma.KnowledgeDocumentGetPayload<{ include: { uploader: true } }>,
  ): KnowledgeDocumentListItem {
    return {
      id: document.id,
      title: document.title,
      source_type: document.sourceType as KnowledgeDocumentListItem['source_type'],
      mime_type: document.mimeType,
      file_name: document.fileName,
      file_size: document.fileSize,
      storage_path: document.storagePath,
      status: document.status as KnowledgeDocumentListItem['status'],
      segment_count: document.segmentCount,
      token_count: document.tokenCount,
      error_message: document.errorMessage,
      uploaded_by: document.uploader ? this.mapOwner(document.uploader) : null,
      created_at: document.createdAt.toISOString(),
      updated_at: document.updatedAt.toISOString(),
    };
  }

  private mapOverviewDocument(document: Prisma.KnowledgeDocumentGetPayload<{
    include: { knowledge: true };
  }>): KnowledgeOverviewDocumentItem {
    return {
      id: document.id,
      knowledge_id: document.knowledgeId,
      knowledge_name: document.knowledge.name,
      title: document.title,
      source_type: document.sourceType as KnowledgeOverviewDocumentItem['source_type'],
      status: document.status as KnowledgeOverviewDocumentItem['status'],
      segment_count: document.segmentCount,
      token_count: document.tokenCount,
      updated_at: document.updatedAt.toISOString(),
    };
  }

  private mapOverviewTask(task: Prisma.KnowledgeEmbeddingTaskGetPayload<{
    include: { knowledge: true };
  }>): KnowledgeOverviewTaskItem {
    return {
      id: task.id,
      knowledge_id: task.knowledgeId,
      knowledge_name: task.knowledge.name,
      task_type: task.taskType as KnowledgeOverviewTaskItem['task_type'],
      status: task.status as KnowledgeOverviewTaskItem['status'],
      total_items: task.totalItems,
      processed_items: task.processedItems,
      started_at: task.startedAt?.toISOString() ?? null,
      ended_at: task.endedAt?.toISOString() ?? null,
      updated_at: task.updatedAt.toISOString(),
    };
  }

  private mapOverviewRecall(log: Prisma.KnowledgeRecallLogGetPayload<{
    include: { knowledge: true };
  }>): KnowledgeOverviewRecallItem {
    return {
      id: log.id,
      knowledge_id: log.knowledgeId,
      knowledge_name: log.knowledge.name,
      query: log.query,
      mode: log.mode as KnowledgeOverviewRecallItem['mode'],
      status: log.status as KnowledgeOverviewRecallItem['status'],
      result_count: log.resultCount,
      latency_ms: log.latencyMs,
      created_at: log.createdAt.toISOString(),
    };
  }

  private mapSegment(segment: Prisma.KnowledgeSegmentGetPayload<object>): KnowledgeSegmentItem {
    const metadata = segment.metadata;
    const normalizedMetadata = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : null;

    return {
      id: segment.id,
      document_id: segment.documentId,
      content: segment.content,
      token_count: segment.tokenCount,
      keywords: segment.keywords,
      embedding_model: segment.embeddingModel,
      metadata: normalizedMetadata,
      vector_backend: normalizedMetadata?.vector_backend === 'QDRANT' ? 'QDRANT' : 'POSTGRES_FALLBACK',
      vector_collection: typeof normalizedMetadata?.qdrant_collection === 'string'
        ? normalizedMetadata.qdrant_collection
        : null,
      vector_error_message: typeof normalizedMetadata?.qdrant_error === 'string'
        ? normalizedMetadata.qdrant_error
        : null,
      keyword_backend: normalizedMetadata?.keyword_backend === 'OPENSEARCH' ? 'OPENSEARCH' : 'POSTGRES_FALLBACK',
      keyword_index: typeof normalizedMetadata?.opensearch_index === 'string'
        ? normalizedMetadata.opensearch_index
        : null,
      keyword_error_message: typeof normalizedMetadata?.opensearch_error === 'string'
        ? normalizedMetadata.opensearch_error
        : null,
      vector_status: segment.vectorStatus as KnowledgeSegmentItem['vector_status'],
      index_status: segment.indexStatus as KnowledgeSegmentItem['index_status'],
      sort_order: segment.sortOrder,
      created_at: segment.createdAt.toISOString(),
      updated_at: segment.updatedAt.toISOString(),
    };
  }

  private mapTask(task: Prisma.KnowledgeEmbeddingTaskGetPayload<object>): KnowledgeTaskItem {
    return {
      id: task.id,
      document_id: task.documentId,
      task_type: task.taskType as KnowledgeTaskItem['task_type'],
      status: task.status as KnowledgeTaskItem['status'],
      total_items: task.totalItems,
      processed_items: task.processedItems,
      started_at: task.startedAt?.toISOString() ?? null,
      ended_at: task.endedAt?.toISOString() ?? null,
      error_message: task.errorMessage,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    };
  }

  private mapRecallLog(
    log: Prisma.KnowledgeRecallLogGetPayload<{ include: { operator: true } }>,
  ): KnowledgeRecallLogItem {
    return {
      id: log.id,
      query: log.query,
      mode: log.mode as KnowledgeRecallLogItem['mode'],
      top_k: log.topK,
      status: log.status as KnowledgeRecallLogItem['status'],
      latency_ms: log.latencyMs,
      result_count: log.resultCount,
      results: parseRecallResults(log.results),
      error_message: log.errorMessage,
      created_at: log.createdAt.toISOString(),
      created_by: log.operator ? this.mapOwner(log.operator) : null,
    };
  }

  private mapRecallResult(segment: ScoredSegment): KnowledgeRecallResultItem {
    return {
      segment_id: segment.id,
      document_id: segment.documentId,
      document_title: segment.document.title,
      content: segment.content,
      score: segment.score,
      keyword_score: segment.keywordScore,
      vector_score: segment.vectorScore,
      keywords: segment.keywords,
      source_type: segment.document.sourceType as KnowledgeRecallResultItem['source_type'],
    };
  }

  private mapConversationReference(segment: ScoredSegment): ConversationReferenceItem {
    return {
      id: segment.id,
      title: segment.document.title,
      snippet: segment.content.length > 240 ? `${segment.content.slice(0, 240)}…` : segment.content,
      score: segment.score,
      source_type: segment.document.sourceType,
    };
  }
}

function chunkText(content: string) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs.length > 0 ? paragraphs : [content]) {
    if (`${current}\n\n${paragraph}`.trim().length > 900 && current) {
      chunks.push(current.trim());
      current = paragraph;
      continue;
    }

    current = `${current}\n\n${paragraph}`.trim();
  }

  if (current) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [content.slice(0, 900)];
}

function estimateTokens(content: string) {
  const asciiWords = content.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const cjkChars = content.match(/[\u4e00-\u9fff]/g)?.length ?? 0;

  return Math.max(1, asciiWords + Math.ceil(cjkChars / 2));
}

function extractKeywords(content: string) {
  const normalized = content.toLowerCase();
  const words = normalized.match(/[a-z0-9_]{2,}/g) ?? [];
  const cjkRuns = normalized.match(/[\u4e00-\u9fff]{2,}/g) ?? [];
  const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'your', 'you', 'are', 'was']);
  const counts = new Map<string, number>();

  for (const word of words) {
    if (stopWords.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  for (const run of cjkRuns) {
    for (const token of buildCjkTerms(run)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word]) => word);
}

function parseRecallResults(value: Prisma.JsonValue | null): KnowledgeRecallResultItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    .map((item) => item as unknown as KnowledgeRecallResultItem);
}

function buildKnowledgeFileName(title: string, sourceType: string, checksum: string) {
  const extension = sourceType === 'MARKDOWN' ? 'md' : sourceType === 'HTML' ? 'html' : 'txt';
  const baseName = title
    .trim()
    .replace(/[^\w\-\u4e00-\u9fa5]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'knowledge-document';

  return `${baseName}-${checksum.slice(0, 12)}.${extension}`;
}

function defaultMimeType(sourceType: string) {
  if (sourceType === 'MARKDOWN') return 'text/markdown';
  if (sourceType === 'HTML') return 'text/html';
  return 'text/plain';
}

function buildMinioStoragePath(tenantId: string, relativeKey: string) {
  const bucket = process.env.MINIO_BUCKET ?? 'aiaget-files';

  return `minio://${bucket}/tenants/${tenantId}/${relativeKey}`;
}

function buildVectorMetadata(
  metadata: Prisma.JsonValue | null,
  input: {
    backend: 'QDRANT' | 'POSTGRES_FALLBACK';
    collection: string | null;
    errorMessage: string | null;
    indexedCount: number;
    source: string;
  },
) {
  const current = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {};

  return {
    ...current,
    retrieval_profile: input.source,
    vector_backend: input.backend,
    qdrant_collection: input.collection,
    qdrant_error: input.errorMessage,
    qdrant_indexed_count: input.indexedCount,
    qdrant_indexed_at: new Date().toISOString(),
  };
}

function buildKeywordMetadata(
  metadata: Prisma.JsonValue | null,
  input: OpenSearchWriteResult,
) {
  const current = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {};

  return {
    ...current,
    keyword_backend: input.backend,
    opensearch_error: input.error_message,
    opensearch_index: input.index,
    opensearch_indexed_at: new Date().toISOString(),
    opensearch_indexed_count: input.indexed_count,
  };
}

function buildCjkTerms(run: string) {
  const terms = new Set<string>();

  if (run.length <= 4) {
    terms.add(run);
  }

  for (let size = 2; size <= 3; size += 1) {
    for (let index = 0; index <= run.length - size; index += 1) {
      terms.add(run.slice(index, index + size));
    }
  }

  return [...terms];
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[\s,.!?，。？！:：；;、"'`~()[\]{}<>-]+/g, '');
}

function buildRecallTracePayload(currentUser: AuthenticatedUser) {
  return {
    trace_id: currentUser.traceId ?? null,
    span_id: currentUser.spanId ?? null,
    traceparent: currentUser.traceparent ?? null,
  };
}

async function buildEmbeddings(prisma: PrismaService, tenantId: string, texts: string[]) {
  const context = await resolveEmbeddingContext(prisma, tenantId);

  if (context) {
    const result = await executeOpenAiCompatibleEmbeddings({
      apiKey: context.apiKey,
      baseUrl: context.baseUrl,
      model: context.model,
      input: texts,
    });

    if (!result.errorMessage && result.embeddings.length === texts.length) {
      return {
        source: 'provider-embedding',
        model: result.requestModel,
        vectors: result.embeddings.map((embedding) => normalizeVector(embedding)),
      };
    }
  }

  return {
    source: 'local-hash-embedding',
    model: 'local-hash-embedding-v1',
    vectors: texts.map((text) => buildLocalEmbedding(text)),
  };
}

async function resolveEmbeddingContext(prisma: PrismaService, tenantId: string): Promise<EmbeddingContext | null> {
  const model = await prisma.modelConfig.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      status: 'ACTIVE',
      capabilities: {
        has: 'embedding',
      },
      provider: {
        is: {
          deletedAt: null,
          status: 'ACTIVE',
          providerType: 'OPENAI_COMPATIBLE',
        },
      },
    },
    include: {
      provider: {
        include: {
          apiKeys: {
            where: {
              deletedAt: null,
              status: 'ACTIVE',
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });

  if (!model) {
    return null;
  }

  const activeKey = model.provider.apiKeys[0] ?? null;
  if (!activeKey) {
    return null;
  }

  return {
    model: model.model,
    apiKey: decryptSecret(activeKey.encryptedKey),
    baseUrl: model.provider.baseUrl,
  };
}

async function scoreSegments(
  openSearchService: OpenSearchService,
  qdrantService: QdrantService,
  prisma: PrismaService,
  tenantId: string,
  knowledgeId: string,
  query: string,
  segments: SegmentWithDocument[],
  mode: 'VECTOR' | 'KEYWORD' | 'HYBRID',
  topK: number,
): Promise<ScoredSegment[]> {
  const terms = extractKeywords(query);
  const normalizedQuery = normalizeSearchText(query);
  const embeddingBundle = await buildEmbeddings(prisma, tenantId, [query]);
  const queryVector = embeddingBundle.vectors[0] ?? [];
  const openSearch = mode === 'VECTOR'
    ? null
    : await openSearchService.searchSegments({
        tenantId,
        knowledgeId,
        limit: Math.min(Math.max(topK * 8, 50), Math.max(50, segments.length)),
        query,
      });
  const qdrantSearch = mode === 'KEYWORD'
    ? null
    : await qdrantService.searchSegments({
        tenantId,
        knowledgeId,
        queryVector,
        limit: Math.min(Math.max(topK * 8, 50), Math.max(50, segments.length)),
      });
  const useOpenSearch = Boolean(openSearch && openSearch.backend === 'OPENSEARCH' && openSearch.scores.size > 0);
  const useQdrant = Boolean(qdrantSearch && qdrantSearch.backend === 'QDRANT' && qdrantSearch.scores.size > 0);
  const maxOpenSearchScore = useOpenSearch ? Math.max(...(openSearch?.scores.values() ?? [1]), 1) : 1;

  return segments
    .map((segment) => {
      const content = normalizeSearchText(segment.content);
      let keywordScore = useOpenSearch
        ? openSearch?.scores.get(segment.id) ?? 0
        : normalizedQuery && content.includes(normalizedQuery) ? 10 : 0;

      if (!useOpenSearch) {
        for (const term of terms) {
          if (content.includes(term)) keywordScore += 2;
          if (segment.keywords.includes(term)) keywordScore += 3;
          if (normalizeSearchText(segment.document.title).includes(term)) keywordScore += 1.5;
        }
      }

      const vectorScore = useQdrant
        ? qdrantSearch?.scores.get(segment.id) ?? 0
        : postgresVectorScore(queryVector, segment.embeddingVector);
      const normalizedKeyword = useOpenSearch
        ? Math.min(keywordScore / maxOpenSearchScore, 1)
        : Math.min(keywordScore / 20, 1);
      const normalizedVector = useQdrant
        ? Math.max(0, Math.min(vectorScore, 1))
        : Math.max(0, Math.min((vectorScore + 1) / 2, 1));
      const score =
        mode === 'KEYWORD'
          ? keywordScore
          : mode === 'VECTOR'
            ? normalizedVector * 100
            : normalizedKeyword * 45 + normalizedVector * 55;

      return {
        ...segment,
        keywordScore: Number(keywordScore.toFixed(3)),
        vectorScore: Number(vectorScore.toFixed(6)),
        score: Number(score.toFixed(3)),
      };
    })
    .filter((segment) =>
      mode === 'KEYWORD'
        ? segment.keywordScore > 0
        : mode === 'VECTOR'
          ? segment.vectorScore > 0
          : segment.keywordScore > 0 || segment.vectorScore > 0,
    )
    .sort((a, b) => b.score - a.score || a.sortOrder - b.sortOrder);
}

function buildLocalEmbedding(text: string, dimension = 48) {
  const tokens = extractKeywords(text);
  const vector = new Array<number>(dimension).fill(0);

  for (const token of tokens) {
    const digest = createHash('sha256').update(token).digest();
    for (let offset = 0; offset < 4; offset += 1) {
      const index = (digest[offset] ?? 0) % dimension;
      const sign = ((digest[offset + 8] ?? 0) % 2 === 0) ? 1 : -1;
      const weight = 1 + (digest[offset + 16] ?? 0) / 255;
      vector[index] = (vector[index] ?? 0) + sign * weight;
    }
  }

  return normalizeVector(vector);
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector.map(() => 0);
  }

  return vector.map((value) => Number((value / magnitude).toFixed(8)));
}

function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);
  if (length === 0) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / Math.sqrt(leftMagnitude * rightMagnitude);
}

function postgresVectorScore(queryVector: number[], value: Prisma.JsonValue | null) {
  const vector = parseEmbeddingVector(value);

  return queryVector.length > 0 && vector.length > 0
    ? cosineSimilarity(queryVector, vector)
    : 0;
}

function parseEmbeddingVector(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === 'number') as number[];
}
