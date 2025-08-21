-- AlterTable
ALTER TABLE "order" ADD COLUMN     "preparedItems" TEXT[] DEFAULT ARRAY[]::TEXT[];
