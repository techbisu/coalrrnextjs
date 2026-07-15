-- CreateTable
CREATE TABLE "paf_census_record" (
    "id" TEXT NOT NULL,
    "paf_id" TEXT NOT NULL,
    "claimant_name" TEXT NOT NULL,
    "category_of_entitlement" TEXT NOT NULL,
    "sc_st_obc_category" TEXT,
    "plot_id" TEXT,
    "photo_identity_card_doc" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "paf_census_record_pkey" PRIMARY KEY ("id")
);

