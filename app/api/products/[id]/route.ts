import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client';

// Utilisez Partial<Prisma.ProductUpdateInput> pour updateData
type UpdateProductData = Partial<Prisma.ProductUpdateInput>;

// GET /api/products/[id] - Récupérer un produit par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const product = await prisma.product.findUnique({
      where: {
        id
      },
      include: {
        category: true,
        variants: {
          orderBy: { price: 'asc' }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du produit' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Supprimer un produit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a des commandes qui référencent ce produit
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: id }
    })

    if (orderItemsCount > 0) {
      return NextResponse.json(
        { 
          error: `Impossible de supprimer ce produit car il est référencé dans ${orderItemsCount} commande(s). Vous pouvez le désactiver à la place.`,
          suggestion: 'Désactiver le produit plutôt que le supprimer'
        },
        { status: 400 }
      )
    }

    // Supprimer d'abord les variantes (cascade automatique normalement, mais on s'assure)
    await prisma.variant.deleteMany({
      where: {
        productId: id
      }
    })

    // Ensuite supprimer le produit
    await prisma.product.delete({
      where: {
        id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Produit supprimé avec succès'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du produit' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Mettre à jour un produit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      isAvailable
    } = body

    // Vérifier que le produit existe
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Créer un objet de données à mettre à jour avec uniquement les champs fournis
    const updateData: UpdateProductData = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (categoryId !== undefined) updateData.category = { connect: { id: categoryId } }
    if (price !== undefined) updateData.price = price
    if (ingredients !== undefined) updateData.ingredients = ingredients
    if (allergens !== undefined) updateData.allergens = allergens
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable

    // Vérifier l'unicité du slug seulement si le slug est modifié
    if (slug !== undefined && slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findFirst({
        where: {
          slug,
          NOT: { id }
        }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Ce slug est déjà utilisé par un autre produit' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour le produit avec uniquement les champs fournis
    const updatedProduct = await prisma.product.update({
      where: {
        id
      },
      data: updateData,
      include: {
        category: true,
        variants: {
          orderBy: { price: 'asc' }
        }
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du produit' },
      { status: 500 }
    )
  }
} 