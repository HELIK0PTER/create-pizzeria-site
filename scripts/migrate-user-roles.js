// Script pour migrer les anciens rôles "user" vers "customer"
// À exécuter avec: node scripts/migrate-user-roles.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateUserRoles() {
  console.log("🔄 Migration des rôles utilisateurs...");

  try {
    // Trouver tous les utilisateurs avec le rôle "user"
    const usersToMigrate = await prisma.user.findMany({
      where: {
        role: "user",
      },
    });

    console.log(`📊 ${usersToMigrate.length} utilisateur(s) à migrer`);

    if (usersToMigrate.length === 0) {
      console.log("✅ Aucune migration nécessaire");
      return;
    }

    // Migrer tous les utilisateurs "user" vers "customer"
    const result = await prisma.user.updateMany({
      where: {
        role: "user",
      },
      data: {
        role: "customer",
      },
    });

    console.log(`✅ ${result.count} utilisateur(s) migré(s) avec succès`);
    console.log("🎉 Migration terminée !");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUserRoles();
