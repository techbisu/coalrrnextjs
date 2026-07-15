-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "aadhaar_hash" TEXT,
    "name" TEXT NOT NULL,
    "password_hash" TEXT,
    "designation" TEXT,
    "mine_cd" TEXT,
    "plot_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");


-- CreateIndex
CREATE UNIQUE INDEX "user_mobile_key" ON "user"("mobile");


-- CreateIndex
CREATE UNIQUE INDEX "user_aadhaar_hash_key" ON "user"("aadhaar_hash");

