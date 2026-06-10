/*
  Warnings:

  - You are about to drop the column `machineType` on the `Product` table. All the data in the column will be lost.
  - Added the required column `machineTypeId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Product_machineType_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "machineType",
ADD COLUMN     "machineTypeId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "MachineType";

-- CreateTable
CREATE TABLE "MachineType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MachineType_name_key" ON "MachineType"("name");

-- CreateIndex
CREATE INDEX "Product_machineTypeId_idx" ON "Product"("machineTypeId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_machineTypeId_fkey" FOREIGN KEY ("machineTypeId") REFERENCES "MachineType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
