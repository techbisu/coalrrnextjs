-- CreateTable
CREATE TABLE "auth_session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "auth_session_token_key" ON "auth_session"("token");

