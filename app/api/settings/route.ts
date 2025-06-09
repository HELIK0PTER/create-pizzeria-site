import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { variables } from "@/settings/config";
const prisma = new PrismaClient();

// Paramètres par défaut pour l'initialisation
const defaultSettings = {
  name: variables.title,
  slogan: variables.slogan,
  phone: variables.phone,
  email: variables.email,
  address: variables.address,
  openingHours: variables.openingHours,
  deliveryZone: variables.deliveryZone,
  isOpen: variables.isOpen,
  closedMessage: variables.closedMessage,
  clickAndCollectEnabled: variables.clickAndCollectEnabled,
  deliveryEnabled: variables.deliveryEnabled,
  deliveryFee: variables.deliveryFee,
  freeDeliveryThreshold: variables.freeDeliveryThreshold,
  minOrderAmount: variables.minOrderAmount,
  deliveryTime: variables.deliveryTime,
  preparationTime: variables.preparationTime,
  pickupInstructions: variables.pickupInstructions,
  cashEnabled: variables.cashEnabled,
  cardEnabled: variables.cardEnabled,
  onlinePaymentEnabled: variables.onlinePaymentEnabled,
  cashMaxAmount: variables.cashMaxAmount,
  ticketsRestaurantEnabled: variables.ticketsRestaurantEnabled,
  checkEnabled: variables.checkEnabled,
  welcomeMessage: variables.welcomeMessage,
  adminEmail: variables.adminEmail,
  orderNotificationEmail: variables.orderNotificationEmail,
};

// GET - Récupérer les paramètres
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Créer les paramètres par défaut s'ils n'existent pas
      settings = await prisma.settings.create({
        data: defaultSettings,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erreur lors de la récupération des paramètres:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour les paramètres
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();

    // Validation basique
    if (data.deliveryFee !== undefined && data.deliveryFee < 0) {
      return NextResponse.json(
        { error: "Les frais de livraison ne peuvent pas être négatifs" },
        { status: 400 }
      );
    }

    if (data.minOrderAmount !== undefined && data.minOrderAmount < 0) {
      return NextResponse.json(
        { error: "Le montant minimum de commande ne peut pas être négatif" },
        { status: 400 }
      );
    }

    if (data.cashMaxAmount !== undefined && data.cashMaxAmount < 0) {
      return NextResponse.json(
        {
          error:
            "Le montant maximum pour paiement en espèces ne peut pas être négatif",
        },
        { status: 400 }
      );
    }

    // Vérifier s'il existe déjà des paramètres
    const existingSettings = await prisma.settings.findFirst();

    let settings;
    if (existingSettings) {
      // Mettre à jour
      settings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: data,
      });
    } else {
      // Créer avec les données fournies et les valeurs par défaut
      settings = await prisma.settings.create({
        data: { ...defaultSettings, ...data },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des paramètres:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde" },
      { status: 500 }
    );
  }
}
