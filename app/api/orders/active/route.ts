import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requireDeliveryOrAdminAPI } from '@/lib/auth-helpers'

// GET /api/orders/active
// Par défaut: renvoie { count } des commandes actives de l'utilisateur courant
// Avec ?list=true: renvoie la liste des commandes actives (pour livreur/admin)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const list = url.searchParams.get('list') === 'true'

    if (list) {
      // Vérifier permissions livreur/admin
      const { error, status } = await requireDeliveryOrAdminAPI(request)
      if (error) {
        return NextResponse.json({ error }, { status: status || 403 })
      }

      const orders = await prisma.order.findMany({
        where: {
          AND: [
            {
              OR: [
                { deliveryMethod: { equals: 'delivery', mode: 'insensitive' } },
                { deliveryMethod: { equals: 'livraison', mode: 'insensitive' } }
              ]
            },
            {
              OR: [
                { status: 'ready' },
                { status: 'delivering' }
              ]
            }
          ]
        },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          deliveryAddress: true,
          deliveryMethod: true,
          status: true,
          total: true,
          createdAt: true,
          pickupTime: true,
          delivererId: true,
          deliverer: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      return NextResponse.json(orders)
    }

    // Comportement historique: compteur pour l'utilisateur courant
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Compter les commandes actives (non terminées et non annulées)
    const activeOrdersCount = await prisma.order.count({
      where: {
        userId: session.user.id,
        status: {
          notIn: ['completed', 'cancelled']
        }
      }
    })

    return NextResponse.json({ count: activeOrdersCount })
  } catch (error) {
    console.error('Error handling active orders endpoint:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
} 