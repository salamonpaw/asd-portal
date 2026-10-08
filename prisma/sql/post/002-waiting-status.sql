-- v0.21.0 — uruchamiane PO prisma db push (wymaga nowej wartości enuma OCZEKUJE_NA_CZESCI)
-- Zamówienia wydzielone automatycznie "czekają na części" — dotąd miały ten sam status co ręczne zawieszenie.
UPDATE "ServiceOrder" SET "status" = 'OCZEKUJE_NA_CZESCI'
WHERE "status" = 'ZAWIESZONE' AND "notes" LIKE 'Split z zamówienia %';
