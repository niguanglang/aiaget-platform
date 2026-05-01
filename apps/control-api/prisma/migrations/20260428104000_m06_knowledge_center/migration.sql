CREATE TABLE "knowledge_base" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "owner_id" UUID,
  "name" VARCHAR(160) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "visibility" VARCHAR(30) NOT NULL DEFAULT 'PRIVATE',
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_document" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "knowledge_id" UUID NOT NULL,
  "title" VARCHAR(220) NOT NULL,
  "source_type" VARCHAR(30) NOT NULL DEFAULT 'TEXT',
  "mime_type" VARCHAR(160),
  "file_name" VARCHAR(260),
  "file_size" INTEGER NOT NULL DEFAULT 0,
  "storage_path" VARCHAR(500),
  "checksum" VARCHAR(120),
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "parsed_text" TEXT,
  "error_message" TEXT,
  "segment_count" INTEGER NOT NULL DEFAULT 0,
  "token_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "uploaded_by" UUID,
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "knowledge_document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_segment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "knowledge_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "token_count" INTEGER NOT NULL DEFAULT 0,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB,
  "vector_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "index_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "knowledge_segment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_embedding_task" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "knowledge_id" UUID NOT NULL,
  "document_id" UUID,
  "task_type" VARCHAR(40) NOT NULL DEFAULT 'PROCESS',
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "total_items" INTEGER NOT NULL DEFAULT 0,
  "processed_items" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_embedding_task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_recall_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "knowledge_id" UUID NOT NULL,
  "query" TEXT NOT NULL,
  "mode" VARCHAR(30) NOT NULL DEFAULT 'HYBRID',
  "top_k" INTEGER NOT NULL DEFAULT 5,
  "status" VARCHAR(30) NOT NULL,
  "latency_ms" INTEGER NOT NULL DEFAULT 0,
  "result_count" INTEGER NOT NULL DEFAULT 0,
  "results" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  CONSTRAINT "knowledge_recall_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "knowledge_base_tenant_id_code_key" ON "knowledge_base"("tenant_id", "code");
CREATE INDEX "knowledge_base_tenant_id_idx" ON "knowledge_base"("tenant_id");
CREATE INDEX "knowledge_base_owner_id_idx" ON "knowledge_base"("owner_id");
CREATE INDEX "knowledge_base_visibility_idx" ON "knowledge_base"("visibility");
CREATE INDEX "knowledge_base_status_idx" ON "knowledge_base"("status");
CREATE INDEX "knowledge_base_created_at_idx" ON "knowledge_base"("created_at");
CREATE INDEX "knowledge_base_updated_at_idx" ON "knowledge_base"("updated_at");
CREATE INDEX "knowledge_base_deleted_at_idx" ON "knowledge_base"("deleted_at");

CREATE INDEX "knowledge_document_tenant_id_idx" ON "knowledge_document"("tenant_id");
CREATE INDEX "knowledge_document_knowledge_id_idx" ON "knowledge_document"("knowledge_id");
CREATE INDEX "knowledge_document_source_type_idx" ON "knowledge_document"("source_type");
CREATE INDEX "knowledge_document_status_idx" ON "knowledge_document"("status");
CREATE INDEX "knowledge_document_checksum_idx" ON "knowledge_document"("checksum");
CREATE INDEX "knowledge_document_created_at_idx" ON "knowledge_document"("created_at");
CREATE INDEX "knowledge_document_updated_at_idx" ON "knowledge_document"("updated_at");
CREATE INDEX "knowledge_document_deleted_at_idx" ON "knowledge_document"("deleted_at");

CREATE INDEX "knowledge_segment_tenant_id_idx" ON "knowledge_segment"("tenant_id");
CREATE INDEX "knowledge_segment_knowledge_id_idx" ON "knowledge_segment"("knowledge_id");
CREATE INDEX "knowledge_segment_document_id_idx" ON "knowledge_segment"("document_id");
CREATE INDEX "knowledge_segment_vector_status_idx" ON "knowledge_segment"("vector_status");
CREATE INDEX "knowledge_segment_index_status_idx" ON "knowledge_segment"("index_status");
CREATE INDEX "knowledge_segment_sort_order_idx" ON "knowledge_segment"("sort_order");
CREATE INDEX "knowledge_segment_created_at_idx" ON "knowledge_segment"("created_at");
CREATE INDEX "knowledge_segment_updated_at_idx" ON "knowledge_segment"("updated_at");
CREATE INDEX "knowledge_segment_deleted_at_idx" ON "knowledge_segment"("deleted_at");

CREATE INDEX "knowledge_embedding_task_tenant_id_idx" ON "knowledge_embedding_task"("tenant_id");
CREATE INDEX "knowledge_embedding_task_knowledge_id_idx" ON "knowledge_embedding_task"("knowledge_id");
CREATE INDEX "knowledge_embedding_task_document_id_idx" ON "knowledge_embedding_task"("document_id");
CREATE INDEX "knowledge_embedding_task_task_type_idx" ON "knowledge_embedding_task"("task_type");
CREATE INDEX "knowledge_embedding_task_status_idx" ON "knowledge_embedding_task"("status");
CREATE INDEX "knowledge_embedding_task_created_at_idx" ON "knowledge_embedding_task"("created_at");
CREATE INDEX "knowledge_embedding_task_updated_at_idx" ON "knowledge_embedding_task"("updated_at");

CREATE INDEX "knowledge_recall_log_tenant_id_idx" ON "knowledge_recall_log"("tenant_id");
CREATE INDEX "knowledge_recall_log_knowledge_id_idx" ON "knowledge_recall_log"("knowledge_id");
CREATE INDEX "knowledge_recall_log_mode_idx" ON "knowledge_recall_log"("mode");
CREATE INDEX "knowledge_recall_log_status_idx" ON "knowledge_recall_log"("status");
CREATE INDEX "knowledge_recall_log_created_at_idx" ON "knowledge_recall_log"("created_at");

ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_document" ADD CONSTRAINT "knowledge_document_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_document" ADD CONSTRAINT "knowledge_document_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "knowledge_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_document" ADD CONSTRAINT "knowledge_document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_segment" ADD CONSTRAINT "knowledge_segment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_segment" ADD CONSTRAINT "knowledge_segment_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "knowledge_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_segment" ADD CONSTRAINT "knowledge_segment_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_embedding_task" ADD CONSTRAINT "knowledge_embedding_task_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_embedding_task" ADD CONSTRAINT "knowledge_embedding_task_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "knowledge_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_embedding_task" ADD CONSTRAINT "knowledge_embedding_task_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_recall_log" ADD CONSTRAINT "knowledge_recall_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_recall_log" ADD CONSTRAINT "knowledge_recall_log_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "knowledge_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_recall_log" ADD CONSTRAINT "knowledge_recall_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
