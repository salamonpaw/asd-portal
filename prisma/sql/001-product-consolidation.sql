-- v0.20.0 — scalenie zdublowanych pól produktu (idempotentne, bezpieczne do wielokrotnego uruchomienia)
--   Product.inStock        → Inventory.currentStock  (Inventory = jedyne źródło stanu)
--   Product.image / images → ProductImage             (jedna tabela zdjęć)
-- Dane są kopiowane PRZED usunięciem kolumn; brak kolumny = krok już wykonany.
DO $$
DECLARE r RECORD;
BEGIN
  -- 1) Stan magazynowy
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'inStock') THEN
    INSERT INTO "Inventory" (id, "productId", "currentStock", "createdAt", "updatedAt")
    SELECT 'inv_' || p.id, p.id, GREATEST(p."inStock", 0), now(), now()
    FROM "Product" p
    WHERE p."inStock" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "Inventory" i WHERE i."productId" = p.id);  -- istniejący stan magazynu wygrywa
    ALTER TABLE "Product" DROP COLUMN "inStock";
    RAISE NOTICE 'Product.inStock → Inventory: done';
  END IF;

  -- 2) Główne zdjęcie (Product.image) — jako pierwsze w kolejności
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'image') THEN
    INSERT INTO "ProductImage" (id, "productId", "filePath", "fileName", "mimeType", "fileSize", "uploadedBy", "uploadedAt")
    SELECT 'img_' || md5(p.id || p.image), p.id, p.image, regexp_replace(p.image, '^.*/', ''),
           CASE WHEN p.image ~* '\.png($|\?)' THEN 'image/png'
                WHEN p.image ~* '\.webp($|\?)' THEN 'image/webp'
                WHEN p.image ~* '\.gif($|\?)' THEN 'image/gif'
                ELSE 'image/jpeg' END,
           0, 'migracja', now() - interval '1 minute'
    FROM "Product" p
    WHERE COALESCE(p.image, '') <> ''
      AND NOT EXISTS (SELECT 1 FROM "ProductImage" pi WHERE pi."productId" = p.id AND pi."filePath" = p.image);
    ALTER TABLE "Product" DROP COLUMN "image";
    RAISE NOTICE 'Product.image → ProductImage: done';
  END IF;

  -- 3) Galeria URL (Product.images, JSON) — wiersz z błędnym JSON jest pomijany, nie przerywa migracji
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'images') THEN
    FOR r IN SELECT id, images FROM "Product" WHERE COALESCE(images, '') NOT IN ('', '[]') LOOP
      BEGIN
        INSERT INTO "ProductImage" (id, "productId", "filePath", "fileName", "mimeType", "fileSize", "uploadedBy", "uploadedAt")
        SELECT 'img_' || md5(r.id || u), r.id, u, regexp_replace(u, '^.*/', ''), 'image/jpeg', 0, 'migracja', now()
        FROM jsonb_array_elements_text(r.images::jsonb) AS u
        WHERE u <> ''
          AND NOT EXISTS (SELECT 1 FROM "ProductImage" pi WHERE pi."productId" = r.id AND pi."filePath" = u);
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'Pominięto nieprawidłowe images dla produktu %', r.id;
      END;
    END LOOP;
    ALTER TABLE "Product" DROP COLUMN "images";
    RAISE NOTICE 'Product.images → ProductImage: done';
  END IF;
END $$;
