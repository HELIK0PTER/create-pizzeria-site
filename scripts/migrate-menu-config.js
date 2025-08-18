const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateMenuConfig() {
  try {
    console.log('🚀 Début de la migration des menus...');

    // Vérifier si les colonnes existent déjà
    const existingColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menu_product' 
      AND column_name IN ('allowChoice', 'minQuantity', 'maxQuantity')
    `;

    if (existingColumns.length === 3) {
      console.log('✅ Les colonnes existent déjà, migration terminée.');
      return;
    }

    // Ajouter les nouvelles colonnes
    console.log('📝 Ajout des colonnes allowChoice, minQuantity, maxQuantity...');
    
    await prisma.$executeRaw`ALTER TABLE menu_product ADD COLUMN IF NOT EXISTS "allowChoice" BOOLEAN DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE menu_product ADD COLUMN IF NOT EXISTS "minQuantity" INTEGER DEFAULT 1`;
    await prisma.$executeRaw`ALTER TABLE menu_product ADD COLUMN IF NOT EXISTS "maxQuantity" INTEGER DEFAULT 1`;

    console.log('✅ Colonnes ajoutées avec succès !');

    // Mettre à jour les menus existants pour qu'ils soient en mode "fixe" par défaut
    console.log('🔄 Mise à jour des menus existants...');
    
    await prisma.$executeRaw`
      UPDATE menu_product 
      SET "allowChoice" = false, "minQuantity" = 1, "maxQuantity" = 1 
      WHERE "allowChoice" IS NULL
    `;

    console.log('✅ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateMenuConfig()
  .then(() => {
    console.log('🎉 Migration des menus terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec de la migration:', error);
    process.exit(1);
  });
