ALTER TABLE "knowledge_segment"
  ADD COLUMN "embedding_vector" JSONB;

ALTER TABLE "knowledge_segment"
  ADD COLUMN "embedding_model" VARCHAR(160);
