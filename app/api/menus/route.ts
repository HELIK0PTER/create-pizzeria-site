import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, image, price, pizzaIds, drinkIds, dessertIds } = body

    // Validation simple
    if (!name || !image || !price) {
      return NextResponse.json(
        { error: 'Nom, image et prix du menu sont requis' },
        { status: 400 }
      )
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json(
        { error: 'Le prix doit être un nombre positif' },
        { status: 400 }
      )
    }

    // Créer le menu et les produits associés
    const newMenu = await prisma.menu.create({
      data: {
        name,
        image,
        price: parsedPrice,
        menuProducts: {
          create: [
            ...pizzaIds.map((id: string) => ({
              productId: id,
              type: 'pizza',
            })),
            ...drinkIds.map((id: string) => ({
              productId: id,
              type: 'drink',
            })),
            ...dessertIds.map((id: string) => ({
              productId: id,
              type: 'dessert',
            })),
          ],
        },
      },
      include: {
        menuProducts: true,
      },
    })

    return NextResponse.json(newMenu, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du menu:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur lors de la création du menu' },
      { status: 500 }
    )
  }
} 