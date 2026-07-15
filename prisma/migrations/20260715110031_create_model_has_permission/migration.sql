-- CreateTable
CREATE TABLE "model_has_permission" (
    "permission_id" TEXT NOT NULL,
    "model_type" TEXT NOT NULL DEFAULT 'user',
    "model_id" TEXT NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "model_has_permission_pkey" PRIMARY KEY ("permission_id","model_type","model_id")
);


-- CreateIndex
CREATE INDEX "model_has_permission_model_type_model_id_idx" ON "model_has_permission"("model_type", "model_id");

