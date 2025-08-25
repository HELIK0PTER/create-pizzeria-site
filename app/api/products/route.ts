import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { requireAdminAPI } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: {
          orderBy: { price: 'asc' }
        }
      },
      orderBy: {
        name: 'asc'
      }
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
      categoryIds,
      price,
      ingredients,
      allergens,
      isAvailable = true
    } = body

    // Validation des champs requis
    if (!name || !slug || !description || !price) {
      return NextResponse.json(
        { error: 'Les champs nom, slug, description et prix sont requis' },
        { status: 400 }
      )
    }

    // Gérer les catégories (support pour l'ancien format categoryId et le nouveau categoryIds)
    const selectedCategoryIds = categoryIds || (categoryId ? [categoryId] : [])
    
    if (selectedCategoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Veuillez sélectionner au moins une catégorie' },
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

    // Vérifier que toutes les catégories existent
    const categories = await prisma.category.findMany({
      where: { id: { in: selectedCategoryIds } }
    })

    if (categories.length !== selectedCategoryIds.length) {
      return NextResponse.json(
        { error: 'Une ou plusieurs catégories sélectionnées n\'existent pas' },
        { status: 400 }
      )
    }

    // Utiliser la première catégorie comme catégorie principale (pour la compatibilité avec le schéma actuel)
    const primaryCategoryId = selectedCategoryIds[0]

    // Créer le produit
    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        image: image || null, // L'image peut être nulle
        categoryId: primaryCategoryId,
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