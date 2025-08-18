import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const menuId = resolvedParams.id

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        menuProducts: {
          include: {
            product: {
              include: {
                category: true,
                variants: true
              }
            }
          }
        }
      }
    })

    if (!menu) {
      return NextResponse.json(
        { error: 'Menu non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(menu)
  } catch (error) {
    console.error('Erreur lors de la récupération du menu:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur lors de la récupération du menu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const menuId = resolvedParams.id

    // Vérifier si le menu existe
    const existingMenu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: { menuProducts: true }
    })

    if (!existingMenu) {
      return NextResponse.json(
        { error: 'Menu non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer d'abord les relations menuProducts
    await prisma.menuProduct.deleteMany({
      where: { menuId: menuId }
    })

    // Puis supprimer le menu
    await prisma.menu.delete({
      where: { id: menuId }
    })

    return NextResponse.json(
      { message: 'Menu supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression du menu:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur lors de la suppression du menu' },
      { status: 500 }
    )
  }
}
