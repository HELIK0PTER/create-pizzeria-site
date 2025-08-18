-- AlterTable
ALTER TABLE "MenuProduct" ADD COLUMN     "allowChoice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "minQuantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "delivererId" TEXT;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_delivererId_fkey" FOREIGN KEY ("delivererId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
