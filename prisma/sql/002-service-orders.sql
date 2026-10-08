-- v0.21.0 — porządkowanie zamówień części (idempotentne; uruchamiane PRZED prisma db push)
--  • wycena wspólna dla zamówienia: ServiceOrder.currency / exchangeRate (PLN za 1 jednostkę)
--  • ceny pozycji: jedno znaczenie (za 1 szt., w walucie zamówienia) — odtworzenie brakujących pól
--  • "Realizuj później" (PendingOrderItem) → ServiceOrder.expectedDate; tabela usunięta
--  • usunięte zdublowane kolumny pozycji: currency, exchangeRate, fulfilledQuantity
DO $$
BEGIN
  ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "currency" "Currency" NOT NULL DEFAULT 'PLN';
  ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1;
  ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "pricedAt" TIMESTAMP(3);
  ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "expectedDate" TIMESTAMP(3);
  ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "parentOrderId" TEXT;

  -- Rekonstrukcja cen tylko przy pierwszym uruchomieniu (stare kolumny jeszcze istnieją).
  -- Dotychczasowe kwoty nigdy nie były przeliczane walutą → zamówienia zostają w PLN (kurs 1).
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ServiceOrderItem' AND column_name = 'fulfilledQuantity') THEN
    -- a) wycena ze szczegółów: jest finalPrice, brak unitPrice → odtwórz cenę katalogową z rabatu
    UPDATE "ServiceOrderItem" SET "unitPrice" = CASE
        WHEN "discountType" = 'PERCENT' AND COALESCE("discountValue", 0) < 100
          THEN round("finalPrice" / (1 - COALESCE("discountValue", 0) / 100.0), 2)
        WHEN "discountType" = 'AMOUNT' THEN "finalPrice" + COALESCE("discountValue", 0)
        ELSE "finalPrice" END
    WHERE "unitPrice" IS NULL AND "finalPrice" IS NOT NULL;

    -- b) wycena z listy: jest unitPrice, brak finalPrice; rabat kwotowy był liczony raz na pozycję → na 1 szt.
    UPDATE "ServiceOrderItem" SET
      "discountValue" = CASE WHEN "discountType" = 'AMOUNT'
          THEN round(COALESCE("discountValue", 0) / GREATEST("quantity", 1), 2) ELSE "discountValue" END,
      "finalPrice" = GREATEST(0, CASE
          WHEN "discountType" = 'PERCENT' THEN round("unitPrice" * (1 - COALESCE("discountValue", 0) / 100.0), 2)
          WHEN "discountType" = 'AMOUNT' THEN round("unitPrice" - COALESCE("discountValue", 0) / GREATEST("quantity", 1), 2)
          ELSE "unitPrice" END)
    WHERE "unitPrice" IS NOT NULL AND "finalPrice" IS NULL;
  END IF;

  -- Zamówienie wycenione = wszystkie pozycje mają cenę końcową
  UPDATE "ServiceOrder" o SET "pricedAt" = o."updatedAt"
  WHERE o."pricedAt" IS NULL
    AND EXISTS (SELECT 1 FROM "ServiceOrderItem" i WHERE i."serviceOrderId" = o.id)
    AND NOT EXISTS (SELECT 1 FROM "ServiceOrderItem" i WHERE i."serviceOrderId" = o.id AND i."finalPrice" IS NULL);

  -- Powiązanie wydzielonych zamówień z zamówieniem źródłowym (dotąd tylko w notatce)
  UPDATE "ServiceOrder" c SET "parentOrderId" = p.id
  FROM "ServiceOrder" p
  WHERE c."parentOrderId" IS NULL
    AND c."notes" LIKE 'Split z zamówienia %'
    AND p."code" = substring(c."notes" from 'Split z zamówienia (SRV-[0-9]+-[0-9]+)');

  -- "Realizuj później": data przenoszona na zamówienie, tabela usuwana (nikt jej nie wyświetlał)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PendingOrderItem') THEN
    UPDATE "ServiceOrder" o SET "expectedDate" = sub.d
    FROM (SELECT "serviceOrderId", max("expectedDate") AS d FROM "PendingOrderItem" WHERE "status" = 'PENDING' GROUP BY 1) sub
    WHERE o.id = sub."serviceOrderId" AND o."expectedDate" IS NULL;
    DROP TABLE "PendingOrderItem";
  END IF;

  ALTER TABLE "ServiceOrderItem" DROP COLUMN IF EXISTS "currency";
  ALTER TABLE "ServiceOrderItem" DROP COLUMN IF EXISTS "exchangeRate";
  ALTER TABLE "ServiceOrderItem" DROP COLUMN IF EXISTS "fulfilledQuantity";
END $$;
