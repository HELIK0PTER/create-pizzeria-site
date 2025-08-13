const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDeliveryRole() {
  try {
    console.log('🚀 Début de la migration pour ajouter le rôle delivery...');

    // Vérifier si des utilisateurs ont déjà le rôle delivery
    const existingDeliveryUsers = await prisma.user.findMany({
      where: {
        role: 'delivery'
      }
    });

    if (existingDeliveryUsers.length > 0) {
      console.log(`✅ ${existingDeliveryUsers.length} utilisateur(s) ont déjà le rôle delivery`);
      return;
    }

    // Optionnel : Promouvoir un utilisateur existant en livreur
    // Vous pouvez modifier cette logique selon vos besoins
    const usersToPromote = await prisma.user.findMany({
      where: {
        role: 'customer',
        // Ajoutez des critères spécifiques si nécessaire
        // email: { contains: 'delivery' }
      },
      take: 1 // Limiter à 1 utilisateur pour l'exemple
    });

    if (usersToPromote.length > 0) {
      const userToPromote = usersToPromote[0];
      console.log(`📧 Promotion de l'utilisateur: ${userToPromote.email} (${userToPromote.name})`);

      await prisma.user.update({
        where: { id: userToPromote.id },
        data: { role: 'delivery' }
      });

      console.log(`✅ Utilisateur ${userToPromote.email} promu en livreur`);
    } else {
      console.log('ℹ️  Aucun utilisateur à promouvoir automatiquement');
      console.log('💡 Vous pouvez promouvoir manuellement des utilisateurs via l\'interface d\'administration');
    }

    // Vérifier la structure de la base de données
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    console.log('\n📊 Statistiques des utilisateurs par rôle:');
    userCounts.forEach(count => {
      console.log(`   ${count.role}: ${count._count.role} utilisateur(s)`);
    });

    console.log('\n✅ Migration terminée avec succès !');
    console.log('🔐 Les utilisateurs avec le rôle "delivery" peuvent maintenant accéder à /livreur');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
addDeliveryRole();
