ALTER TABLE "users"
  ALTER COLUMN "address" TYPE VARCHAR(500),
  ALTER COLUMN "address" DROP NOT NULL,
  ALTER COLUMN "city_id" DROP NOT NULL;

UPDATE "cities" SET "region" = 'Gaza Strip' WHERE "region" IS NULL;

ALTER TABLE "cities"
  ALTER COLUMN "region" SET DEFAULT 'Gaza Strip',
  ALTER COLUMN "region" SET NOT NULL;
