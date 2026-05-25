-- AlterTable
ALTER TABLE "Actor" ADD COLUMN     "wardUnitId" TEXT;

-- AddForeignKey
ALTER TABLE "Actor" ADD CONSTRAINT "Actor_wardUnitId_fkey" FOREIGN KEY ("wardUnitId") REFERENCES "WardUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
