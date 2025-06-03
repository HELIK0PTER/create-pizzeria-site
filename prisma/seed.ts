import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seeding...");

  // Nettoyer les données existantes
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.dailyStats.deleteMany();

  // 1. Créer les paramètres de la pizzeria
  console.log("📋 Création des paramètres...");
  await prisma.settings.create({
    data: {
      name: "Bella Pizza Napoli",
      slogan: "L'authenticité italienne dans chaque bouchée",
      phone: "01 42 36 89 12",
      email: "contact@bellapizza-napoli.fr",
      address: "147 Avenue de la République, 75011 Paris",
      openingHours: {
        monday: { open: "11:30", close: "22:30", closed: false },
        tuesday: { open: "11:30", close: "22:30", closed: false },
        wednesday: { open: "11:30", close: "22:30", closed: false },
        thursday: { open: "11:30", close: "23:00", closed: false },
        friday: { open: "11:30", close: "23:30", closed: false },
        saturday: { open: "11:30", close: "23:30", closed: false },
        sunday: { open: "18:00", close: "22:30", closed: false },
      },
      deliveryZone: [
        "75001",
        "75002",
        "75003",
        "75004",
        "75011",
        "75012",
        "75020",
      ],
      isOpen: true,
      closedMessage:
        "Nous sommes actuellement fermés. Merci de consulter nos horaires.",
      clickAndCollectEnabled: true,
      deliveryEnabled: true,
      deliveryFee: 2.9,
      freeDeliveryThreshold: 30.0,
      minOrderAmount: 18.0,
      deliveryTime: "25-35 min",
      preparationTime: "15-20 min",
      pickupInstructions:
        "Présentez-vous au comptoir avec votre numéro de commande",
      cashEnabled: true,
      cardEnabled: true,
      onlinePaymentEnabled: true,
      cashMaxAmount: 80.0,
      ticketsRestaurantEnabled: true,
      checkEnabled: false,
      welcomeMessage: "Benvenuti à Bella Pizza Napoli ! 🍕",
      specialAnnouncement:
        "🎉 Nouvelle carte d'automne disponible ! Découvrez nos pizzas aux saveurs de saison.",
      primaryColor: "#E53E3E",
      secondaryColor: "#FED7AA",
      backgroundColor: "#FFFAF0",
      adminEmail: "admin@bellapizza-napoli.fr",
      orderNotificationEmail: true,
    },
  });

  // 2. Créer les utilisateurs
  console.log("👥 Création des utilisateurs...");
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@pizza.fr",
      emailVerified: true,
      phone: "06 12 34 56 78",
      role: "admin",
    },
  });

  await prisma.account.create({
    data: {
      providerId: "google",
      userId: admin.id,
      accountId: admin.id,
      password: "admin",
    },
  });

  const customers = await Promise.all([
    prisma.user.create({
      data: {
        name: "Marie Dubois",
        email: "marie.dubois@email.fr",
        emailVerified: true,
        phone: "06 23 45 67 89",
        role: "customer",
      },
    }),
    prisma.user.create({
      data: {
        name: "Pierre Martin",
        email: "pierre.martin@email.fr",
        emailVerified: true,
        phone: "06 34 56 78 90",
        role: "customer",
      },
    }),
    prisma.user.create({
      data: {
        name: "Sophie Laurent",
        email: "sophie.laurent@email.fr",
        emailVerified: true,
        phone: "06 45 67 89 01",
        role: "customer",
      },
    }),
  ]);

  // 3. Créer les adresses
  console.log("🏠 Création des adresses...");
  await Promise.all([
    prisma.address.create({
      data: {
        userId: customers[0].id,
        name: "Domicile",
        street: "25 Rue de Rivoli",
        city: "Paris",
        postalCode: "75001",
        isDefault: true,
      },
    }),
    prisma.address.create({
      data: {
        userId: customers[1].id,
        name: "Domicile",
        street: "88 Boulevard Saint-Germain",
        city: "Paris",
        postalCode: "75003",
        isDefault: true,
      },
    }),
    prisma.address.create({
      data: {
        userId: customers[2].id,
        name: "Domicile",
        street: "156 Rue du Faubourg Saint-Antoine",
        city: "Paris",
        postalCode: "75011",
        isDefault: true,
      },
    }),
  ]);

  // 4. Créer les catégories
  console.log("📂 Création des catégories...");
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Pizzas",
        slug: "pizzas",
        description:
          "Nos délicieuses pizzas artisanales préparées avec des ingrédients frais",
        image:
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        order: 1,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Boissons",
        slug: "boissons",
        description:
          "Une sélection de boissons rafraîchissantes pour accompagner vos pizzas",
        image:
          "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        order: 2,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Desserts",
        slug: "desserts",
        description:
          "Des desserts italiens authentiques pour finir votre repas en beauté",
        image:
          "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        order: 3,
        isActive: true,
      },
    }),
  ]);

  // 6. Créer les produits - PIZZAS
  // baseType: "Tomate" | "Crème" | "Barbecue"
  console.log("🍕 Création des pizzas...");
  const pizzaProducts = await Promise.all([
    prisma.product.create({
      data: {
        name: "Margherita",
        slug: "margherita",
        description: "La classique italienne avec mozzarella et basilic.",
        image:
          "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        categoryId: categories[0].id,
        price: 13.5,
        isAvailable: true,
        ingredients: "Sauce tomate, mozzarella di bufala, basilic",
        allergens: "Gluten, Lait",
        baseType: "Tomate",
      },
    }),
    prisma.product.create({
      data: {
        name: "Napoli",
        slug: "napoli",
        description: "Une pizza savoureuse avec anchois, câpres et olives.",
        image:
          "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: categories[0].id,
        price: 15.9,
        isAvailable: true,
        ingredients: "Sauce tomate, mozzarella, anchois, câpres, olives",
        allergens: "Gluten, Lait, Poisson",
        baseType: "Tomate",
      },
    }),
    prisma.product.create({
      data: {
        name: "Quattro Stagioni",
        slug: "quattro-stagioni",
        description: "Quatre saveurs distinctes sur une seule pizza.",
        image:
          "https://images.unsplash.com/photo-1681567604770-0dc826c870ae?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        categoryId: categories[0].id,
        price: 17.5,
        isAvailable: true,
        ingredients:
          "Sauce tomate, mozzarella, jambon, champignons, artichauts, olives",
        allergens: "Gluten, Lait",
        baseType: "Tomate",
      },
    }),
    prisma.product.create({
      data: {
        name: "Prosciutto e Funghi",
        slug: "prosciutto-funghi",
        description: "Une combinaison classique de jambon et champignons.",
        image:
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: categories[0].id,
        price: 16.9,
        isAvailable: true,
        ingredients:
          "Sauce tomate, mozzarella, prosciutto di Parma, champignons",
        allergens: "Gluten, Lait",
        baseType: "Tomate",
      },
    }),
    prisma.product.create({
      data: {
        name: "Quattro Formaggi",
        slug: "quattro-formaggi",
        description: "Un mélange riche de quatre fromages.",
        image:
          "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: categories[0].id,
        price: 18.5,
        isAvailable: true,
        ingredients: "Mozzarella, gorgonzola, parmesan, chèvre, noix",
        allergens: "Gluten, Lait, Fruits à coque",
        baseType: "Crème",
      },
    }),
    prisma.product.create({
      data: {
        name: "Diavola",
        slug: "diavola",
        description: "Une pizza épicée pour les amateurs de sensations fortes.",
        image:
          "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: categories[0].id,
        price: 16.5,
        isAvailable: true,
        ingredients: "Sauce tomate épicée, mozzarella, salami piquant, piment",
        allergens: "Gluten, Lait",
        baseType: "Tomate",
      },
    }),
    prisma.product.create({
      data: {
        name: "Vegetariana",
        slug: "vegetariana",
        description: "Une option fraîche et savoureuse avec des légumes grillés.",
        image:
          "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: categories[0].id,
        price: 15.5,
        isAvailable: true,
        ingredients:
          "Aubergines, courgettes, poivrons, tomates cerises, roquette",
        allergens: "Gluten, Lait",
        baseType: "Tomate",
      },
    }),
    prisma.product.create({
      data: {
        name: "Tartufo",
        slug: "tartufo",
        description: "Pizza sophistiquée à la crème de truffe.",
        image:
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: categories[0].id,
        price: 24.9,
        isAvailable: true,
        ingredients: "Crème de truffe, champignons, parmesan, roquette",
        allergens: "Gluten, Lait",
        baseType: "Crème",
      },
    }),
  ]);

  // 7. Créer les variantes pour les pizzas
  console.log("📏 Création des variantes de pizzas...");
  for (const pizza of pizzaProducts) {
    await Promise.all([
      prisma.variant.create({
        data: {
          productId: pizza.id,
          name: "Petite (26cm)",
          price: 0, // Prix de base
          isDefault: true,
        },
      }),
      prisma.variant.create({
        data: {
          productId: pizza.id,
          name: "Moyenne (30cm)",
          price: 3.0, // +3€
          isDefault: false,
        },
      }),
      prisma.variant.create({
        data: {
          productId: pizza.id,
          name: "Grande (34cm)",
          price: 6.0, // +6€
          isDefault: false,
        },
      }),
    ]);
  }

  // 8. Créer les produits - BOISSONS
  console.log("🥤 Création des boissons...");
  const drinkProducts = await Promise.all([
    prisma.product.create({
      data: {
        name: "Coca-Cola",
        slug: "coca-cola",
        description: "Coca-Cola original en canette 33cl",
        image:
          "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        categoryId: categories[1].id,
        price: 2.5,
        isAvailable: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Eau Pétillante San Pellegrino",
        slug: "san-pellegrino",
        description: "Eau minérale pétillante italienne 50cl",
        image:
          "https://images.unsplash.com/photo-1591970826523-a16139b0a3fd?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        categoryId: categories[1].id,
        price: 3.0,
        isAvailable: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Limonade Artisanale",
        slug: "limonade-artisanale",
        description: "Limonade maison au citron de Sicile, menthe fraîche",
        image:
          "https://images.unsplash.com/photo-1621263764928-df1444c5e859?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: categories[1].id,
        price: 4.5,
        isAvailable: true,
        ingredients: "Citron, menthe, sucre de canne, eau gazeuse",
      },
    }),
    prisma.product.create({
      data: {
        name: "Bière Peroni",
        slug: "biere-peroni",
        description: "Bière italienne blonde 33cl",
        image:
          "https://images.unsplash.com/photo-1660648351455-4e60b1047300?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        categoryId: categories[1].id,
        price: 4.0,
        isAvailable: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Café Espresso",
        slug: "cafe-espresso",
        description: "Café espresso italien traditionnel",
        image:
          "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: categories[1].id,
        price: 2.0,
        isAvailable: true,
      },
    }),
  ]);

  // 9. Créer les produits - DESSERTS
  console.log("🍰 Création des desserts...");
  const dessertProducts = await Promise.all([
    prisma.product.create({
      data: {
        name: "Tiramisu Maison",
        slug: "tiramisu-maison",
        description:
          "Le célèbre dessert italien fait maison",
        image:
          "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: categories[2].id,
        price: 6.5,
        isAvailable: true,
        ingredients: "Mascarpone, café, biscuits, cacao, œufs",
        allergens: "Lait, Œufs, Gluten",
      },
    }),
    prisma.product.create({
      data: {
        name: "Panna Cotta aux Fruits Rouges",
        slug: "panna-cotta-fruits-rouges",
        description:
          "Crème à la vanille de Madagascar et coulis de fruits rouges",
        image:
          "https://images.unsplash.com/photo-1542116021-0ff087fb0a41?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        categoryId: categories[2].id,
        price: 5.5,
        isAvailable: true,
        ingredients: "Crème, vanille, gélatine, fruits rouges",
        allergens: "Lait",
      },
    }),
    prisma.product.create({
      data: {
        name: "Cannoli Siciliens",
        slug: "cannoli-siciliens",
        description:
          "Tubes croustillants fourrés à la ricotta et pépites de chocolat (2 pièces)",
        image:
          "https://images.unsplash.com/photo-1667804957652-565b39dcccd4?q=80&w=1113&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        categoryId: categories[2].id,
        price: 7.0,
        isAvailable: true,
        ingredients: "Pâte, ricotta, chocolat, pistaches",
        allergens: "Gluten, Lait, Fruits à coque",
      },
    }),
    prisma.product.create({
      data: {
        name: "Gelato Artisanal",
        slug: "gelato-artisanal",
        description: "Glace italienne artisanale, parfums au choix (2 boules)",
        image:
          "https://images.unsplash.com/photo-1648971413826-8377e3c65039?q=80&w=1036&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        categoryId: categories[2].id,
        price: 5.0,
        isAvailable: true,
        ingredients: "Lait, crème, sucre, parfums naturels",
        allergens: "Lait",
      },
    }),
    prisma.product.create({
      data: {
        name: "Limoncello Maison",
        slug: "limoncello-maison",
        description: "Liqueur de citron artisanale servie glacée (4cl)",
        image:
          "https://images.unsplash.com/photo-1658754486968-99f7e8c1545b?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        categoryId: categories[2].id,
        price: 4.5,
        isAvailable: true,
        ingredients: "Citrons de Sorrento, alcool, sucre",
      },
    }),
  ]);

  // 10. Créer quelques commandes de test
  console.log("📝 Création des commandes de test...");
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: "CMD001",
        userId: customers[0].id,
        customerName: customers[0].name,
        customerEmail: customers[0].email,
        customerPhone: customers[0].phone || "",
        deliveryAddress: "25 Rue de Rivoli, 75001 Paris",
        deliveryMethod: "delivery",
        status: "completed",
        paymentMethod: "stripe",
        paymentStatus: "paid",
        subTotal: 26.0,
        deliveryFee: 2.9,
        total: 28.9,
        notes: "Code porte : 1234A",
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: "CMD002",
        userId: customers[1].id,
        customerName: customers[1].name,
        customerEmail: customers[1].email,
        customerPhone: customers[1].phone || "",
        deliveryMethod: "pickup",
        status: "ready",
        paymentMethod: "cash",
        paymentStatus: "pending",
        subTotal: 32.0,
        deliveryFee: 0,
        total: 32.0,
        pickupTime: new Date(Date.now() + 15 * 60 * 1000), // Dans 15 minutes
      },
    }),
  ]);

  // 11. Créer les articles des commandes
  await Promise.all([
    // Commande 1
    prisma.orderItem.create({
      data: {
        orderId: orders[0].id,
        productId: pizzaProducts[0].id, // Margherita
        quantity: 1,
        unitPrice: 13.5,
        totalPrice: 13.5,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: orders[0].id,
        productId: pizzaProducts[3].id, // Prosciutto e Funghi
        quantity: 1,
        unitPrice: 16.9,
        totalPrice: 16.9,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: orders[0].id,
        productId: drinkProducts[1].id, // San Pellegrino
        quantity: 2,
        unitPrice: 3.0,
        totalPrice: 6.0,
      },
    }),
    // Commande 2
    prisma.orderItem.create({
      data: {
        orderId: orders[1].id,
        productId: pizzaProducts[4].id, // Quattro Formaggi
        quantity: 1,
        unitPrice: 18.5,
        totalPrice: 18.5,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: orders[1].id,
        productId: dessertProducts[0].id, // Tiramisu
        quantity: 1,
        unitPrice: 6.5,
        totalPrice: 6.5,
      },
    }),
  ]);

  // 12. Créer quelques statistiques journalières
  console.log("📊 Création des statistiques...");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(dayBefore.getDate() - 2);

  await Promise.all([
    prisma.dailyStats.create({
      data: {
        date: dayBefore,
        ordersCount: 15,
        revenue: 387.5,
      },
    }),
    prisma.dailyStats.create({
      data: {
        date: yesterday,
        ordersCount: 23,
        revenue: 542.3,
      },
    }),
    prisma.dailyStats.create({
      data: {
        date: today,
        ordersCount: 8,
        revenue: 189.2,
      },
    }),
  ]);

  console.log("✅ Seeding terminé avec succès !");
  console.log(`
📋 Données créées :
- 1 configuration de pizzeria
- 4 utilisateurs (1 admin + 3 clients)
- 3 catégories
- ${pizzaProducts.length + drinkProducts.length + dessertProducts.length} produits
- ${pizzaProducts.length * 3} variantes de pizzas
- 2 commandes avec articles
- 3 jours de statistiques
- 3 adresses clients
  `);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erreur lors du seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
