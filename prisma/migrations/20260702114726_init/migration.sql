-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "aadhaarHash" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "designation" TEXT,
    "collieryCode" TEXT,
    "plotId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MstProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "collieryCode" TEXT NOT NULL,
    "totalLandLimitAcres" DECIMAL(10,4) NOT NULL,
    "totalBudgetCeiling" DECIMAL(15,2) NOT NULL,
    "totalEmploymentQuota" INTEGER NOT NULL,
    "boundary" TEXT NOT NULL,
    "statutoryClearances" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MstProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MstMouza" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MstMouza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MstPlot" (
    "id" TEXT NOT NULL,
    "mouzaId" TEXT NOT NULL,
    "plotNumber" TEXT NOT NULL,
    "khataNumber" TEXT,
    "landType" TEXT NOT NULL,
    "areaAcres" DECIMAL(10,4) NOT NULL,
    "geometry" TEXT,
    "exhaustedAreaForJobs" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "remainingJobQuota" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MstPlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandSchedule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scheduleCode" TEXT NOT NULL,
    "acquisitionMode" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "modeSpecificChecklist" TEXT,
    "meta" TEXT,
    "proposalTitle" TEXT,
    "description" TEXT,
    "proposedBy" TEXT,
    "proposedByRole" TEXT,
    "areaOffice" TEXT,
    "collieryCode" TEXT,
    "adjacentColliery" TEXT,
    "totalAreaAcres" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "annexureA" TEXT,
    "annexureB" TEXT,
    "annexureC" TEXT,
    "notificationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandScheduleItem" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "annexureTag" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormIClaim" (
    "id" TEXT NOT NULL,
    "claimCode" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "citizenIdHash" TEXT NOT NULL,
    "claimantName" TEXT NOT NULL,
    "ownShareAcres" DECIMAL(10,4) NOT NULL,
    "optedMonetaryInLieuOfEmployment" BOOLEAN NOT NULL DEFAULT false,
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "submittedAt" TIMESTAMP(3),
    "transparencyWindowEndsAt" TIMESTAMP(3),
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormIClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompensationPayroll" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "payrollCode" TEXT NOT NULL,
    "multiplicationFactor" DECIMAL(6,4) NOT NULL DEFAULT 1.0000,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "landownerCount" INTEGER NOT NULL DEFAULT 0,
    "totalAward" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompensationPayroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompensationPayrollLine" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "landownerName" TEXT NOT NULL,
    "plotReference" TEXT NOT NULL,
    "landValue" DECIMAL(15,2) NOT NULL,
    "assetValue" DECIMAL(15,2) NOT NULL,
    "solatiumAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "escalationAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "totalAward" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "yearsSinceNotification" INTEGER NOT NULL DEFAULT 0,
    "formulaSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompensationPayrollLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PafCensusRecord" (
    "id" TEXT NOT NULL,
    "pafId" TEXT NOT NULL,
    "claimantName" TEXT NOT NULL,
    "categoryOfEntitlement" TEXT NOT NULL,
    "scStObcCategory" TEXT,
    "plotId" TEXT,
    "photoIdentityCardDoc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PafCensusRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RnrAssetPayroll" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "payrollCode" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RnrAssetPayroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RnrAssetPayrollLine" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "entitlementType" TEXT NOT NULL,
    "valuationAmount" DECIMAL(15,2) NOT NULL,
    "pwdRateReference" TEXT,
    "formulaSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RnrAssetPayrollLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormDLedgerEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "amountLand" DECIMAL(15,2) NOT NULL,
    "amountRnr" DECIMAL(15,2) NOT NULL,
    "payeeType" TEXT NOT NULL,
    "payeeName" TEXT NOT NULL,
    "rtgsUtrReference" TEXT,
    "rowHash" TEXT,
    "previousHash" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormDLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NomineePool" (
    "id" TEXT NOT NULL,
    "nomineeAadhaarHash" TEXT NOT NULL,
    "nomineeName" TEXT NOT NULL,
    "pooledAcreage" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "applyButtonUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NomineePool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NomineePoolContribution" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "formIClaimId" TEXT NOT NULL,
    "shareAcres" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NomineePoolContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentApplication" (
    "id" TEXT NOT NULL,
    "applicationCode" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "nomineePoolId" TEXT NOT NULL,
    "formIxBalanceAcres" DECIMAL(10,4) NOT NULL,
    "formXBalanceJobs" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "exceptionFlags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowReviewTask" (
    "id" TEXT NOT NULL,
    "reviewableType" TEXT NOT NULL,
    "reviewableId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowReviewTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "vaultableType" TEXT NOT NULL,
    "vaultableId" TEXT NOT NULL,
    "checklistItemKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeKb" INTEGER NOT NULL,
    "virusScanStatus" TEXT NOT NULL DEFAULT 'clean',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "grievanceCode" TEXT NOT NULL,
    "relatedType" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "complainantName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "slaDueAt" TIMESTAMP(3) NOT NULL,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "User_aadhaarHash_key" ON "User"("aadhaarHash");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_token_key" ON "AuthSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "MstPlot_mouzaId_plotNumber_key" ON "MstPlot"("mouzaId", "plotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FormIClaim_citizenIdHash_plotId_key" ON "FormIClaim"("citizenIdHash", "plotId");

-- CreateIndex
CREATE UNIQUE INDEX "NomineePool_nomineeAadhaarHash_key" ON "NomineePool"("nomineeAadhaarHash");

-- CreateIndex
CREATE UNIQUE INDEX "NomineePoolContribution_poolId_formIClaimId_key" ON "NomineePoolContribution"("poolId", "formIClaimId");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MstPlot" ADD CONSTRAINT "MstPlot_mouzaId_fkey" FOREIGN KEY ("mouzaId") REFERENCES "MstMouza"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandSchedule" ADD CONSTRAINT "LandSchedule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MstProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandScheduleItem" ADD CONSTRAINT "LandScheduleItem_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "LandSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandScheduleItem" ADD CONSTRAINT "LandScheduleItem_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "MstPlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormIClaim" ADD CONSTRAINT "FormIClaim_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "MstPlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationPayroll" ADD CONSTRAINT "CompensationPayroll_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MstProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationPayrollLine" ADD CONSTRAINT "CompensationPayrollLine_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "CompensationPayroll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PafCensusRecord" ADD CONSTRAINT "PafCensusRecord_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "MstPlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RnrAssetPayroll" ADD CONSTRAINT "RnrAssetPayroll_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MstProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RnrAssetPayrollLine" ADD CONSTRAINT "RnrAssetPayrollLine_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "RnrAssetPayroll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormDLedgerEntry" ADD CONSTRAINT "FormDLedgerEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MstProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormDLedgerEntry" ADD CONSTRAINT "FormDLedgerEntry_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "MstPlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NomineePoolContribution" ADD CONSTRAINT "NomineePoolContribution_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "NomineePool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NomineePoolContribution" ADD CONSTRAINT "NomineePoolContribution_formIClaimId_fkey" FOREIGN KEY ("formIClaimId") REFERENCES "FormIClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentApplication" ADD CONSTRAINT "EmploymentApplication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "MstProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentApplication" ADD CONSTRAINT "EmploymentApplication_nomineePoolId_fkey" FOREIGN KEY ("nomineePoolId") REFERENCES "NomineePool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
