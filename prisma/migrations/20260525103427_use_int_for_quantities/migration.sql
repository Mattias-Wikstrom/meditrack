-- AlterTable: use plain integers for all quantity/stock columns.
-- Existing decimal values are whole numbers so the cast is lossless.
ALTER TABLE "OrderLine" ALTER COLUMN "quantity" TYPE INTEGER USING "quantity"::INTEGER;

ALTER TABLE "MedicinalProduct" ALTER COLUMN "stockLevel" TYPE INTEGER USING "stockLevel"::INTEGER;
ALTER TABLE "MedicinalProduct" ALTER COLUMN "stockThreshold" TYPE INTEGER USING "stockThreshold"::INTEGER;
