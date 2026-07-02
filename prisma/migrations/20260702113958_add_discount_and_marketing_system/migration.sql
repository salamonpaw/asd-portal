-- Add machineCount to Product
ALTER TABLE "Product" ADD COLUMN "machineCount" INTEGER;

-- Add lockedDiscountPercentage to Project
ALTER TABLE "Project" ADD COLUMN "lockedDiscountPercentage" INTEGER;

-- Create PartnerDiscount table (tier-based discounts with conditions)
CREATE TABLE "PartnerDiscount" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "percentage" DECIMAL(65,30) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "fallbackPercentage" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "machineCountRequired" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdByRepId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerDiscount_pkey" PRIMARY KEY ("id")
);

-- Create PartnerRepAssignment table (many-to-many)
CREATE TABLE "PartnerRepAssignment" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerRepAssignment_pkey" PRIMARY KEY ("id")
);

-- Create PartnerDiscountNotification table
CREATE TABLE "PartnerDiscountNotification" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "partnerDiscountId" TEXT NOT NULL,
    "daysUntilExpiry" INTEGER NOT NULL,
    "notificationSent60Days" BOOLEAN NOT NULL DEFAULT false,
    "notificationSent30Days" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerDiscountNotification_pkey" PRIMARY KEY ("id")
);

-- Create MarketingMaterial table
CREATE TABLE "MarketingMaterial" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingMaterial_pkey" PRIMARY KEY ("id")
);

-- Create MarketingMaterialAccess table
CREATE TABLE "MarketingMaterialAccess" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "accessGrantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingMaterialAccess_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "PartnerDiscount" ADD CONSTRAINT "PartnerDiscount_partnerId_fkey"
    FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerDiscount" ADD CONSTRAINT "PartnerDiscount_createdByRepId_fkey"
    FOREIGN KEY ("createdByRepId") REFERENCES "Rep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PartnerRepAssignment" ADD CONSTRAINT "PartnerRepAssignment_partnerId_fkey"
    FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerRepAssignment" ADD CONSTRAINT "PartnerRepAssignment_repId_fkey"
    FOREIGN KEY ("repId") REFERENCES "Rep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PartnerDiscountNotification" ADD CONSTRAINT "PartnerDiscountNotification_partnerId_fkey"
    FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerDiscountNotification" ADD CONSTRAINT "PartnerDiscountNotification_repId_fkey"
    FOREIGN KEY ("repId") REFERENCES "Rep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PartnerDiscountNotification" ADD CONSTRAINT "PartnerDiscountNotification_partnerDiscountId_fkey"
    FOREIGN KEY ("partnerDiscountId") REFERENCES "PartnerDiscount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketingMaterialAccess" ADD CONSTRAINT "MarketingMaterialAccess_materialId_fkey"
    FOREIGN KEY ("materialId") REFERENCES "MarketingMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketingMaterialAccess" ADD CONSTRAINT "MarketingMaterialAccess_partnerId_fkey"
    FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "PartnerDiscount_partnerId_idx" ON "PartnerDiscount"("partnerId");
CREATE INDEX "PartnerDiscount_createdByRepId_idx" ON "PartnerDiscount"("createdByRepId");
CREATE UNIQUE INDEX "PartnerDiscount_partnerId_expirationDate_key" ON "PartnerDiscount"("partnerId", "expirationDate");

CREATE INDEX "PartnerRepAssignment_partnerId_idx" ON "PartnerRepAssignment"("partnerId");
CREATE INDEX "PartnerRepAssignment_repId_idx" ON "PartnerRepAssignment"("repId");
CREATE UNIQUE INDEX "PartnerRepAssignment_partnerId_repId_key" ON "PartnerRepAssignment"("partnerId", "repId");

CREATE INDEX "PartnerDiscountNotification_partnerId_idx" ON "PartnerDiscountNotification"("partnerId");
CREATE INDEX "PartnerDiscountNotification_repId_idx" ON "PartnerDiscountNotification"("repId");
CREATE INDEX "PartnerDiscountNotification_partnerDiscountId_idx" ON "PartnerDiscountNotification"("partnerDiscountId");

CREATE INDEX "MarketingMaterial_type_idx" ON "MarketingMaterial"("type");
CREATE INDEX "MarketingMaterialAccess_materialId_idx" ON "MarketingMaterialAccess"("materialId");
CREATE INDEX "MarketingMaterialAccess_partnerId_idx" ON "MarketingMaterialAccess"("partnerId");
CREATE UNIQUE INDEX "MarketingMaterialAccess_materialId_partnerId_key" ON "MarketingMaterialAccess"("materialId", "partnerId");
