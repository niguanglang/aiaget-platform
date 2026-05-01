-- CreateTable
CREATE TABLE "conversation" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "user_id" UUID,
    "title" VARCHAR(220) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_preview" VARCHAR(500),
    "last_message_at" TIMESTAMP(3),
    "last_run_status" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_run" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "request_model" VARCHAR(160),
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "steps" JSONB,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "conversation_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_message" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "run_id" UUID,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "references" JSONB,
    "tool_calls" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "conversation_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_feedback" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "run_id" UUID,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "conversation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_tenant_id_idx" ON "conversation"("tenant_id");

-- CreateIndex
CREATE INDEX "conversation_agent_id_idx" ON "conversation"("agent_id");

-- CreateIndex
CREATE INDEX "conversation_user_id_idx" ON "conversation"("user_id");

-- CreateIndex
CREATE INDEX "conversation_status_idx" ON "conversation"("status");

-- CreateIndex
CREATE INDEX "conversation_last_message_at_idx" ON "conversation"("last_message_at");

-- CreateIndex
CREATE INDEX "conversation_updated_at_idx" ON "conversation"("updated_at");

-- CreateIndex
CREATE INDEX "conversation_deleted_at_idx" ON "conversation"("deleted_at");

-- CreateIndex
CREATE INDEX "conversation_run_tenant_id_idx" ON "conversation_run"("tenant_id");

-- CreateIndex
CREATE INDEX "conversation_run_conversation_id_idx" ON "conversation_run"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_run_agent_id_idx" ON "conversation_run"("agent_id");

-- CreateIndex
CREATE INDEX "conversation_run_status_idx" ON "conversation_run"("status");

-- CreateIndex
CREATE INDEX "conversation_run_created_at_idx" ON "conversation_run"("created_at");

-- CreateIndex
CREATE INDEX "conversation_message_tenant_id_idx" ON "conversation_message"("tenant_id");

-- CreateIndex
CREATE INDEX "conversation_message_conversation_id_idx" ON "conversation_message"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_message_run_id_idx" ON "conversation_message"("run_id");

-- CreateIndex
CREATE INDEX "conversation_message_role_idx" ON "conversation_message"("role");

-- CreateIndex
CREATE INDEX "conversation_message_created_at_idx" ON "conversation_message"("created_at");

-- CreateIndex
CREATE INDEX "conversation_feedback_tenant_id_idx" ON "conversation_feedback"("tenant_id");

-- CreateIndex
CREATE INDEX "conversation_feedback_conversation_id_idx" ON "conversation_feedback"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_feedback_run_id_idx" ON "conversation_feedback"("run_id");

-- CreateIndex
CREATE INDEX "conversation_feedback_created_at_idx" ON "conversation_feedback"("created_at");

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_run" ADD CONSTRAINT "conversation_run_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_run" ADD CONSTRAINT "conversation_run_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_run" ADD CONSTRAINT "conversation_run_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_run" ADD CONSTRAINT "conversation_run_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "conversation_run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_feedback" ADD CONSTRAINT "conversation_feedback_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_feedback" ADD CONSTRAINT "conversation_feedback_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_feedback" ADD CONSTRAINT "conversation_feedback_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "conversation_run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_feedback" ADD CONSTRAINT "conversation_feedback_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
