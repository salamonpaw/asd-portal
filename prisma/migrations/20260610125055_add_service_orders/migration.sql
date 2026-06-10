-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('BĘBNOWY', 'SZAFKOWY', 'TERMINAL', 'WRZUTNIA', 'L40');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('NOWE', 'PRZYJĘTE', 'CZĘŚCIOWO_ZREALIZOWANE', 'ZREALIZOWANE', 'ODRZUCONE', 'ZAWIESZONE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'PARTNER_ADMIN';
ALTER TYPE "Role" ADD VALUE 'SERVICE_TECHNICIAN';
ALTER TYPE "Role" ADD VALUE 'WAREHOUSE_SPECIALIST';

-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'NOWE',
    "deliveryAddress" TEXT NOT NULL,
    "neededDate" TIMESTAMP(3),
    "notes" TEXT,
    "warehouseSpecialistId" TEXT,
    "rejectionReason" TEXT,
    "trackingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrderItem" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "fulfilledQuantity" INTEGER,
    "price" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "machineType" "MachineType" NOT NULL,
    "parentProductId" TEXT,
    "location" TEXT,
    "image" TEXT,
    "serialNumber" TEXT,
    "supplier" TEXT,
    "inStock" INTEGER,
    "basePrice" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrderHistory" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceOrderHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrder_code_key" ON "ServiceOrder"("code");

-- CreateIndex
CREATE INDEX "ServiceOrder_partnerId_idx" ON "ServiceOrder"("partnerId");

-- CreateIndex
CREATE INDEX "ServiceOrder_code_idx" ON "ServiceOrder"("code");

-- CreateIndex
CREATE INDEX "ServiceOrderItem_serviceOrderId_idx" ON "ServiceOrderItem"("serviceOrderId");

-- CreateIndex
CREATE INDEX "ServiceOrderItem_productId_idx" ON "ServiceOrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_machineType_idx" ON "Product"("machineType");

-- CreateIndex
CREATE INDEX "ServiceOrderHistory_serviceOrderId_idx" ON "ServiceOrderHistory"("serviceOrderId");

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_warehouseSpecialistId_fkey" FOREIGN KEY ("warehouseSpecialistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderItem" ADD CONSTRAINT "ServiceOrderItem_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderItem" ADD CONSTRAINT "ServiceOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_parentProductId_fkey" FOREIGN KEY ("parentProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderHistory" ADD CONSTRAINT "ServiceOrderHistory_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
