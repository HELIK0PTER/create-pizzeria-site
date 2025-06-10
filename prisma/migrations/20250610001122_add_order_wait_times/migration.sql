-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "deliveryWaitTimeMax" INTEGER NOT NULL DEFAULT 45,
ADD COLUMN     "deliveryWaitTimeMin" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "orderSuccessMessage" TEXT DEFAULT 'Merci pour votre commande !',
ADD COLUMN     "pickupWaitTimeMax" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN     "pickupWaitTimeMin" INTEGER NOT NULL DEFAULT 15;
