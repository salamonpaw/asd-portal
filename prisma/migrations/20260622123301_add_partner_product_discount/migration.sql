/*
  Warnings:

  - You are about to drop the column `basePrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `ServiceOrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "basePrice",
ALTER COLUMN "costPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "sellingPrice" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ServiceOrderItem" DROP COLUMN "price",
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "finalPrice" SET DATA TYPE DECIMAL(65,30);

-- CreateTable
CREATE TABLE "PartnerProductDiscount" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "discountPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerProductDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnerProductDiscount_partnerId_idx" ON "PartnerProductDiscount"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerProductDiscount_productId_idx" ON "PartnerProductDiscount"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerProductDiscount_partnerId_productId_key" ON "PartnerProductDiscount"("partnerId", "productId");

-- AddForeignKey
ALTER TABLE "PartnerProductDiscount" ADD CONSTRAINT "PartnerProductDiscount_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerProductDiscount" ADD CONSTRAINT "PartnerProductDiscount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
