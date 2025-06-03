import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requireAdminAPI } from '@/lib/auth-helpers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier les permissions admin
  const { error, status } = await requireAdminAPI(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { id } = await params;
    const body = await request.json()
    let { role } = body

    // Validation et normalisation du rôle
    if (!role || !['admin', 'customer', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Utilisez "admin" ou "customer"' },
        { status: 400 }
      )
    }

    // Normaliser "user" vers "customer" pour la compatibilité
    if (role === 'user') {
      role = 'customer'
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si le rôle change vraiment
    const roleChanged = existingUser.role !== role

    // Mettre à jour le rôle
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
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
      }
    })

    // Si le rôle a changé, révoquer toutes les sessions de l'utilisateur
    // pour forcer une reconnexion avec le nouveau rôle
    if (roleChanged) {
      try {
        // Utiliser l'API avec les headers de la requête
        await auth.api.revokeUserSessions({
          body: { userId: id },
          headers: request.headers
        })
        console.log(`Sessions révoquées pour l'utilisateur ${id} suite au changement de rôle`)
      } catch (sessionError) {
        console.error('Erreur lors de la révocation des sessions:', sessionError)
        // On continue même si la révocation échoue
      }
    }

    return NextResponse.json({
      ...updatedUser,
      sessionRevoked: roleChanged
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du rôle utilisateur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier les permissions admin
  const { error, status } = await requireAdminAPI(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { id } = await params;

    // Révoquer toutes les sessions avant de supprimer l'utilisateur
    try {
      await auth.api.revokeUserSessions({
        body: { userId: id },
        headers: request.headers
      })
    } catch (sessionError) {
      console.error('Erreur lors de la révocation des sessions avant suppression:', sessionError)
      // On continue même si la révocation échoue
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Utilisateur supprimé avec succès" }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}
