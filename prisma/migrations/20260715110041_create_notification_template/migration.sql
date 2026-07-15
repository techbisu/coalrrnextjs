-- CreateTable
CREATE TABLE "notification_template" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "notification_template_code_key" ON "notification_template"("code");

