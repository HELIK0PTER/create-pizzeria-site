-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "deliveryPromotionBuy" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "deliveryPromotionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryPromotionGet" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pickupPromotionBuy" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pickupPromotionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupPromotionGet" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "promotionDescription" TEXT DEFAULT 'Promotions sur les pizzas !',
ADD COLUMN     "promotionsEnabled" BOOLEAN NOT NULL DEFAULT false;
