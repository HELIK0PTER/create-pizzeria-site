import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Récupérer la session avec Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(null);
    }

    // Enrichir avec les données complètes de l'utilisateur depuis Prisma
    const fullUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        addresses: true,
        orders: {
          take: 5, // Les 5 dernières commandes
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json(null);
    }

    // Retourner la session avec les données utilisateur enrichies
    return NextResponse.json({
      session,
      user: fullUser,
    });
  } catch (error) {
    console.error("Erreur récupération session:", error);
    return NextResponse.json(null);
  }
}
