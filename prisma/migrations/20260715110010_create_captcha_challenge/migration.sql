-- CreateTable
CREATE TABLE "captcha_challenge" (
    "id" TEXT NOT NULL,
    "expected_answer" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "captcha_challenge_pkey" PRIMARY KEY ("id")
);

