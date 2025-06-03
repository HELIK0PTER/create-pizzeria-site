import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Paramètres par défaut pour l'initialisation
const defaultSettings = {
  name: "Bella Pizza",
  slogan: "Les meilleures pizzas de la ville",
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
    sunday: { open: "18:00", close: "22:00", closed: false }
  },
  deliveryZone: ["75001", "75002", "75003", "75004"],
  isOpen: true,
  closedMessage: "Nous sommes actuellement fermés",
  clickAndCollectEnabled: true,
  deliveryEnabled: true,
  deliveryFee: 3.50,
  freeDeliveryThreshold: 25.00,
  minOrderAmount: 15.00,
  deliveryTime: "30-45 min",
  preparationTime: "15-20 min",
  pickupInstructions: "Présentez-vous à l'accueil avec votre numéro de commande",
  cashEnabled: true,
  cardEnabled: true,
  onlinePaymentEnabled: true,
  cashMaxAmount: 50.00,
  ticketsRestaurantEnabled: true,
  checkEnabled: false,
  welcomeMessage: "Bienvenue chez Bella Pizza !",
  primaryColor: "#EA580C",
  secondaryColor: "#FED7AA",
  backgroundColor: "#FFFFFF",
  adminEmail: "admin@bellapizza.fr",
  orderNotificationEmail: true
}

// GET - Récupérer les paramètres
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      // Créer les paramètres par défaut s'ils n'existent pas
      settings = await prisma.settings.create({
        data: defaultSettings
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour les paramètres
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    
    // Validation basique
    if (data.deliveryFee !== undefined && data.deliveryFee < 0) {
      return NextResponse.json(
        { error: 'Les frais de livraison ne peuvent pas être négatifs' },
        { status: 400 }
      )
    }
    
    if (data.minOrderAmount !== undefined && data.minOrderAmount < 0) {
      return NextResponse.json(
        { error: 'Le montant minimum de commande ne peut pas être négatif' },
        { status: 400 }
      )
    }
    
    if (data.cashMaxAmount !== undefined && data.cashMaxAmount < 0) {
      return NextResponse.json(
        { error: 'Le montant maximum pour paiement en espèces ne peut pas être négatif' },
        { status: 400 }
      )
    }

    // Vérifier s'il existe déjà des paramètres
    let existingSettings = await prisma.settings.findFirst()
    
    let settings
    if (existingSettings) {
      // Mettre à jour
      settings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: data
      })
    } else {
      // Créer avec les données fournies et les valeurs par défaut
      settings = await prisma.settings.create({
        data: { ...defaultSettings, ...data }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    )
  }
} 