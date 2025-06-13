import { Facebook, Instagram, Globe } from "lucide-react";

export const variables = {
  title: "Bella Pizza",
  title_part1: "Bella",
  title_part2: "Pizza",

  subtitle1: "Authentique",
  subtitle2: "Délicieux",

  phone: "01 23 45 67 89",
  email: "contact@bellapizza.fr",
  address: "123 Rue de la Pizza, 75001 Paris",

  openingHours: {
    monday: { open: "11:00", close: "22:00", closed: false },
    tuesday: { open: "11:00", close: "22:00", closed: false },
    wednesday: { open: "11:00", close: "22:00", closed: false },
    thursday: { open: "11:00", close: "22:00", closed: false },
    friday: { open: "11:00", close: "23:00", closed: false },
    saturday: { open: "11:00", close: "23:00", closed: false },
    sunday: { open: "18:00", close: "22:00", closed: false },
  },

  deliveryZone: ["75001", "75002", "75003", "75004"],

  // Paramètres de service
  isOpen: true,
  closedMessage: "Nous sommes actuellement fermés",
  clickAndCollectEnabled: true,
  deliveryEnabled: true,
  deliveryFee: 3.5,
  freeDeliveryThreshold: 25.0,
  minOrderAmount: 15.0,
  deliveryTime: "30-45 min",
  preparationTime: "15-20 min",
  pickupInstructions: "Présentez-vous à l'accueil avec votre numéro de commande",

  // Paramètres de paiement
  cashEnabled: true,
  cardEnabled: true,
  onlinePaymentEnabled: true,
  cashMaxAmount: 50.0,
  ticketsRestaurantEnabled: true,
  checkEnabled: false,

  // Interface utilisateur
  welcomeMessage: "Bienvenue chez Bella Pizza !",

  // Social links
  social_links: [
    { name: "Facebook", href: "#", icon: Facebook },
    { name: "Instagram", href: "#", icon: Instagram },
    { name: "Site web", href: "#", icon: Globe },
  ],

  // Administration
  adminEmail: "admin@bellapizza.fr",
  orderNotificationEmail: true,

  offers: [
    {
      title: "Nouvelle offre",
      description:
        "En livraison pour 2 pizzas achetées la 3eme est offerte.",
    },
    {
      title: "Nouvelle offre",
      description:
        "En retrait dans la boutique pour 2 pizzas achetées la 3eme est offerte.",
    },
  ],
  
  slogan: "Les meilleures pizzas artisanales de la ville, préparées avec des ingrédients frais et de qualité. Livraison rapide et click & collect disponibles.",

  cta_text:
    `Sur toutes les commandes à emporter 
    1 pizza achetée = 1 pizza offerte.
    Sur toutes les commandes en livraison
    2 pizzas achetées = 1 pizza offerte.`,

  };

export const about_us = {
  our_history: `Bienvenue chez Bella Pizza, né d'une passion pour l'authentique pizza napolitaine. Notre aventure a commencé il y a 15 ans dans un petit fournil avec le rêve de partager les saveurs traditionnelles de l'Italie.
  Nous utilisons des ingrédients frais et de qualité supérieure, sourcés localement autant que possible, et une pâte longuement pétrie et maturée pour garantir cette texture légère et aérée caractéristique.`,
  our_values: `Chez Bella Pizza, nous croyons en la qualité, la fraîcheur et la convivialité. Chaque pizza est préparée avec soin et passion, comme si nous la préparions pour notre propre famille.
  Nous nous engageons à offrir une expérience culinaire exceptionnelle, de la sélection des ingrédients à la dernière bouchée, tout en respectant l'environnement et en soutenant les producteurs locaux.`
};
