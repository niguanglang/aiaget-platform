CREATE TABLE "agent_team" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "owner_id" UUID,
  "name" VARCHAR(160) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  "mode" VARCHAR(30) NOT NULL DEFAULT 'SEQUENTIAL',
  "max_rounds" INTEGER NOT NULL DEFAULT 3,
  "timeout_seconds" INTEGER NOT NULL DEFAULT 300,
  "handoff_policy" VARCHAR(30) NOT NULL DEFAULT 'AUTO',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_team_member" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "team_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "role" VARCHAR(80) NOT NULL,
  "responsibility" TEXT,
  "execution_order" INTEGER NOT NULL DEFAULT 0,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_team_member_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_team_run" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "team_id" UUID NOT NULL,
  "objective" TEXT NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
  "request_id" VARCHAR(120),
  "trace_id" VARCHAR(120),
  "total_steps" INTEGER NOT NULL DEFAULT 0,
  "completed_steps" INTEGER NOT NULL DEFAULT 0,
  "failed_steps" INTEGER NOT NULL DEFAULT 0,
  "total_tokens" INTEGER NOT NULL DEFAULT 0,
  "total_cost" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "latency_ms" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_team_run_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_team_step" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "team_id" UUID NOT NULL,
  "run_id" UUID NOT NULL,
  "member_id" UUID,
  "agent_id" UUID,
  "step_type" VARCHAR(60) NOT NULL,
  "title" VARCHAR(220) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "input_summary" TEXT,
  "output_summary" TEXT,
  "trace_id" VARCHAR(120),
  "span_id" VARCHAR(80),
  "parent_span_id" VARCHAR(80),
  "duration_ms" INTEGER NOT NULL DEFAULT 0,
  "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
  "completion_tokens" INTEGER NOT NULL DEFAULT 0,
  "total_tokens" INTEGER NOT NULL DEFAULT 0,
  "cost_total" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_team_step_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_team_handoff" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "team_id" UUID NOT NULL,
  "run_id" UUID NOT NULL,
  "from_member_id" UUID,
  "to_member_id" UUID,
  "from_agent_id" UUID,
  "to_agent_id" UUID,
  "reason" TEXT NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "decision_note" TEXT,
  "decided_by" UUID,
  "decided_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_team_handoff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_team_feedback" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "team_id" UUID NOT NULL,
  "run_id" UUID NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  CONSTRAINT "agent_team_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_team_tenant_id_code_key" ON "agent_team"("tenant_id", "code");
CREATE INDEX "agent_team_tenant_id_idx" ON "agent_team"("tenant_id");
CREATE INDEX "agent_team_owner_id_idx" ON "agent_team"("owner_id");
CREATE INDEX "agent_team_status_idx" ON "agent_team"("status");
CREATE INDEX "agent_team_mode_idx" ON "agent_team"("mode");
CREATE INDEX "agent_team_created_at_idx" ON "agent_team"("created_at");
CREATE INDEX "agent_team_updated_at_idx" ON "agent_team"("updated_at");
CREATE INDEX "agent_team_deleted_at_idx" ON "agent_team"("deleted_at");

CREATE UNIQUE INDEX "agent_team_member_tenant_id_team_id_agent_id_key" ON "agent_team_member"("tenant_id", "team_id", "agent_id");
CREATE INDEX "agent_team_member_tenant_id_idx" ON "agent_team_member"("tenant_id");
CREATE INDEX "agent_team_member_team_id_idx" ON "agent_team_member"("team_id");
CREATE INDEX "agent_team_member_agent_id_idx" ON "agent_team_member"("agent_id");
CREATE INDEX "agent_team_member_role_idx" ON "agent_team_member"("role");
CREATE INDEX "agent_team_member_execution_order_idx" ON "agent_team_member"("execution_order");
CREATE INDEX "agent_team_member_status_idx" ON "agent_team_member"("status");
CREATE INDEX "agent_team_member_created_at_idx" ON "agent_team_member"("created_at");
CREATE INDEX "agent_team_member_updated_at_idx" ON "agent_team_member"("updated_at");
CREATE INDEX "agent_team_member_deleted_at_idx" ON "agent_team_member"("deleted_at");

CREATE INDEX "agent_team_run_tenant_id_idx" ON "agent_team_run"("tenant_id");
CREATE INDEX "agent_team_run_team_id_idx" ON "agent_team_run"("team_id");
CREATE INDEX "agent_team_run_status_idx" ON "agent_team_run"("status");
CREATE INDEX "agent_team_run_request_id_idx" ON "agent_team_run"("request_id");
CREATE INDEX "agent_team_run_trace_id_idx" ON "agent_team_run"("trace_id");
CREATE INDEX "agent_team_run_started_at_idx" ON "agent_team_run"("started_at");
CREATE INDEX "agent_team_run_ended_at_idx" ON "agent_team_run"("ended_at");
CREATE INDEX "agent_team_run_created_at_idx" ON "agent_team_run"("created_at");
CREATE INDEX "agent_team_run_updated_at_idx" ON "agent_team_run"("updated_at");
CREATE INDEX "agent_team_run_deleted_at_idx" ON "agent_team_run"("deleted_at");

CREATE INDEX "agent_team_step_tenant_id_idx" ON "agent_team_step"("tenant_id");
CREATE INDEX "agent_team_step_team_id_idx" ON "agent_team_step"("team_id");
CREATE INDEX "agent_team_step_run_id_idx" ON "agent_team_step"("run_id");
CREATE INDEX "agent_team_step_member_id_idx" ON "agent_team_step"("member_id");
CREATE INDEX "agent_team_step_agent_id_idx" ON "agent_team_step"("agent_id");
CREATE INDEX "agent_team_step_step_type_idx" ON "agent_team_step"("step_type");
CREATE INDEX "agent_team_step_status_idx" ON "agent_team_step"("status");
CREATE INDEX "agent_team_step_trace_id_idx" ON "agent_team_step"("trace_id");
CREATE INDEX "agent_team_step_started_at_idx" ON "agent_team_step"("started_at");
CREATE INDEX "agent_team_step_ended_at_idx" ON "agent_team_step"("ended_at");
CREATE INDEX "agent_team_step_created_at_idx" ON "agent_team_step"("created_at");

CREATE INDEX "agent_team_handoff_tenant_id_idx" ON "agent_team_handoff"("tenant_id");
CREATE INDEX "agent_team_handoff_team_id_idx" ON "agent_team_handoff"("team_id");
CREATE INDEX "agent_team_handoff_run_id_idx" ON "agent_team_handoff"("run_id");
CREATE INDEX "agent_team_handoff_from_member_id_idx" ON "agent_team_handoff"("from_member_id");
CREATE INDEX "agent_team_handoff_to_member_id_idx" ON "agent_team_handoff"("to_member_id");
CREATE INDEX "agent_team_handoff_from_agent_id_idx" ON "agent_team_handoff"("from_agent_id");
CREATE INDEX "agent_team_handoff_to_agent_id_idx" ON "agent_team_handoff"("to_agent_id");
CREATE INDEX "agent_team_handoff_status_idx" ON "agent_team_handoff"("status");
CREATE INDEX "agent_team_handoff_decided_by_idx" ON "agent_team_handoff"("decided_by");
CREATE INDEX "agent_team_handoff_created_at_idx" ON "agent_team_handoff"("created_at");
CREATE INDEX "agent_team_handoff_updated_at_idx" ON "agent_team_handoff"("updated_at");
CREATE INDEX "agent_team_handoff_deleted_at_idx" ON "agent_team_handoff"("deleted_at");

CREATE INDEX "agent_team_feedback_tenant_id_idx" ON "agent_team_feedback"("tenant_id");
CREATE INDEX "agent_team_feedback_team_id_idx" ON "agent_team_feedback"("team_id");
CREATE INDEX "agent_team_feedback_run_id_idx" ON "agent_team_feedback"("run_id");
CREATE INDEX "agent_team_feedback_rating_idx" ON "agent_team_feedback"("rating");
CREATE INDEX "agent_team_feedback_created_at_idx" ON "agent_team_feedback"("created_at");

ALTER TABLE "agent_team" ADD CONSTRAINT "agent_team_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team" ADD CONSTRAINT "agent_team_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agent_team_member" ADD CONSTRAINT "agent_team_member_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_member" ADD CONSTRAINT "agent_team_member_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "agent_team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_member" ADD CONSTRAINT "agent_team_member_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "agent_team_run" ADD CONSTRAINT "agent_team_run_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_run" ADD CONSTRAINT "agent_team_run_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "agent_team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_run" ADD CONSTRAINT "agent_team_run_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agent_team_step" ADD CONSTRAINT "agent_team_step_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_step" ADD CONSTRAINT "agent_team_step_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "agent_team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_step" ADD CONSTRAINT "agent_team_step_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_team_run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_step" ADD CONSTRAINT "agent_team_step_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "agent_team_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_team_step" ADD CONSTRAINT "agent_team_step_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agent_team_handoff" ADD CONSTRAINT "agent_team_handoff_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_handoff" ADD CONSTRAINT "agent_team_handoff_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "agent_team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_handoff" ADD CONSTRAINT "agent_team_handoff_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_team_run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_handoff" ADD CONSTRAINT "agent_team_handoff_from_member_id_fkey" FOREIGN KEY ("from_member_id") REFERENCES "agent_team_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_team_handoff" ADD CONSTRAINT "agent_team_handoff_to_member_id_fkey" FOREIGN KEY ("to_member_id") REFERENCES "agent_team_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_team_handoff" ADD CONSTRAINT "agent_team_handoff_from_agent_id_fkey" FOREIGN KEY ("from_agent_id") REFERENCES "agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_team_handoff" ADD CONSTRAINT "agent_team_handoff_to_agent_id_fkey" FOREIGN KEY ("to_agent_id") REFERENCES "agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_team_handoff" ADD CONSTRAINT "agent_team_handoff_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agent_team_feedback" ADD CONSTRAINT "agent_team_feedback_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_feedback" ADD CONSTRAINT "agent_team_feedback_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "agent_team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_feedback" ADD CONSTRAINT "agent_team_feedback_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_team_run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_team_feedback" ADD CONSTRAINT "agent_team_feedback_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
