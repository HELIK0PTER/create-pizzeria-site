// app/api/favorites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Assurez-vous que 'auth' est bien exporté de cette manière
import { prisma } from "@/lib/prisma"; // Assurez-vous que 'prisma' est exporté de cette manière

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
  }

  const { productId, userId } = await req.json();

  if (!productId || !userId) {
    return NextResponse.json({ message: "ID produit ou ID utilisateur manquant" }, { status: 400 });
  }

  try {
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: userId,
          productId: productId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json({ message: "Produit déjà en favori" }, { status: 200 });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: userId,
        productId: productId,
      },
    });
    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l\'ajout aux favoris:", error);
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
  }

  const { productId, userId } = await req.json();

  if (!productId || !userId) {
    return NextResponse.json({ message: "ID produit ou ID utilisateur manquant" }, { status: 400 });
  }

  try {
    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId: userId,
          productId: productId,
        },
      },
    });
    return NextResponse.json({ message: "Produit retiré des favoris" }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la suppression des favoris:", error);
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const userId = searchParams.get("userId");

  try {
    if (productId && userId) {
      // Vérifier si un produit spécifique est en favori pour un utilisateur
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId: userId,
            productId: productId,
          },
        },
      });
      return NextResponse.json({ isFavorite: !!favorite }, { status: 200 });
    } else if (userId) {
      // Récupérer tous les produits favoris pour un utilisateur
      const favorites = await prisma.favorite.findMany({
        where: { userId: userId },
        include: { product: true }, // Inclure les détails du produit
      });
      return NextResponse.json(favorites, { status: 200 });
    } else {
      return NextResponse.json({ message: "Paramètres de requête manquants" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des favoris:", error);
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
  }
}