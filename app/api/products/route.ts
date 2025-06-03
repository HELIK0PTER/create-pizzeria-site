import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAdminAPI } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = parseInt(searchParams.get('categoryId') || '0')
    const categorySlug = searchParams.get('category')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : undefined

    const where: Prisma.ProductWhereInput = { isAvailable: true }

    // Support pour categoryId (pour compatibilité avec page menu)
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Support pour category slug (pour page d'accueil)
    if (categorySlug) {
      where.category = {
        slug: categorySlug
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          orderBy: { price: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: limit })
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

// POST /api/products - Créer un nouveau produit
export async function POST(request: Request) {
  // Vérifier les permissions admin
  const { error, status } = await requireAdminAPI(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const body = await request.json()
    const {
      name,
      slug,
      description,
      image,
      categoryId,
      price,
      ingredients,
      allergens,
      isAvailable = true
    } = body

    // Validation des champs requis
    if (!name || !slug || !description || !categoryId || !price) {
      return NextResponse.json(
        { error: 'Les champs nom, slug, description, catégorie et prix sont requis' },
        { status: 400 }
      )
    }

    // Vérifier l'unicité du slug
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Ce slug est déjà utilisé par un autre produit' },
        { status: 400 }
      )
    }

    // Vérifier que la catégorie existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 400 }
      )
    }

    // Créer le produit
    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        image: image || null, // L'image peut être nulle
        categoryId,
        price: parseFloat(price),
        ingredients: ingredients || null,
        allergens: allergens || null,
        isAvailable: Boolean(isAvailable)
      },
      include: {
        category: true,
        variants: {
          orderBy: { price: 'asc' }
        }
      }
    })

    console.log('Produit créé:', newProduct) // Debug

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du produit' },
      { status: 500 }
    )
  }
} 