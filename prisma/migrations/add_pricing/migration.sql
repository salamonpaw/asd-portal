-- Add pricing fields to Product
ALTER TABLE "Product" ADD COLUMN "costPrice" DECIMAL(19,2);
ALTER TABLE "Product" ADD COLUMN "sellingPrice" DECIMAL(19,2);

ALTER TABLE "ServiceOrderItem" ADD COLUMN "unitPrice" DECIMAL(19,2);
ALTER TABLE "ServiceOrderItem" ADD COLUMN "discountType" TEXT;
ALTER TABLE "ServiceOrderItem" ADD COLUMN "discountValue" DECIMAL(19,2);
ALTER TABLE "ServiceOrderItem" ADD COLUMN "finalPrice" DECIMAL(19,2);
