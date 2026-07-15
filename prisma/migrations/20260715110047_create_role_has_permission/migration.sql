-- CreateTable
CREATE TABLE "role_has_permission" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "role_has_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

