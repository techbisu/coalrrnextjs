-- CreateTable
CREATE TABLE "captcha_config" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "provider" TEXT NOT NULL DEFAULT 'math',
    "difficulty" TEXT NOT NULL DEFAULT 'difficult',
    "expiration_minutes" INTEGER NOT NULL DEFAULT 5,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "adaptive_captcha" BOOLEAN NOT NULL DEFAULT true,
    "show_after_failed_login" INTEGER NOT NULL DEFAULT 3,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "captcha_config_pkey" PRIMARY KEY ("id")
);

