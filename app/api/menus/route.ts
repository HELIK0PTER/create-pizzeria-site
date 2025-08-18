import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(menus)
  } catch (error) {
    console.error('Erreur lors de la récupération des menus:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur lors de la récupération des menus' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, image, price, productConfigs } = body

    // Validation simple
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nom et prix du menu sont requis' },
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

    // Validation des configurations de produits
    if (!productConfigs || !Array.isArray(productConfigs)) {
      return NextResponse.json(
        { error: 'Configuration des produits requise' },
        { status: 400 }
      )
    }

    // Vérifier qu'au moins une configuration a des produits
    const hasProducts = productConfigs.some((config: unknown) => {
      const typedConfig = config as { allowChoice: boolean; productIds?: string[]; fixedProducts?: string[] }
      return typedConfig.allowChoice 
        ? (typedConfig.productIds?.length || 0) > 0 
        : (typedConfig.fixedProducts?.length || 0) > 0
    })

    if (!hasProducts) {
      return NextResponse.json(
        { error: 'Au moins un type de produit doit être configuré' },
        { status: 400 }
      )
    }

    // Créer le menu et les produits associés
    const newMenu = await prisma.menu.create({
      data: {
        name,
        image: image || null,
        price: parsedPrice,
        menuProducts: {
          create: (() => {
            const menuProducts = []
            for (const config of productConfigs) {
              const typedConfig = config as { 
                allowChoice: boolean; 
                type: string; 
                minQuantity?: number; 
                maxQuantity?: number;
                productIds?: string[];
                fixedProducts?: string[];
              }
              
              if (typedConfig.allowChoice) {
                // Mode choix : créer des entrées pour chaque produit disponible
                for (const productId of typedConfig.productIds || []) {
                  menuProducts.push({
                    productId,
                    type: typedConfig.type,
                    allowChoice: true,
                    minQuantity: typedConfig.minQuantity || 1,
                    maxQuantity: typedConfig.maxQuantity || 1
                  })
                }
              } else {
                // Mode fixe : créer des entrées pour chaque produit fixe
                for (const productId of typedConfig.fixedProducts || []) {
                  menuProducts.push({
                    productId,
                    type: typedConfig.type,
                    allowChoice: false,
                    minQuantity: 1,
                    maxQuantity: 1
                  })
                }
              }
            }
            return menuProducts
          })()
        }
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