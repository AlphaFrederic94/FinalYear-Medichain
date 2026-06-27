ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_encounterId_fkey";
ALTER TABLE "documents" ALTER COLUMN "encounterId" DROP NOT NULL;
ALTER TABLE "documents" ADD CONSTRAINT "documents_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
