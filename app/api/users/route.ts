import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAPI } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  // Vérifier les permissions admin
  const { error, status } = await requireAdminAPI(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        image: true,
        phone: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}
