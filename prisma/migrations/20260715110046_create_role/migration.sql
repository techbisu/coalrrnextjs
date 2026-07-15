-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "guard_name" TEXT NOT NULL DEFAULT 'web',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "role_name_guard_name_key" ON "role"("name", "guard_name");

