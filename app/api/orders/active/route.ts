import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/orders/active - Compter les commandes actives de l'utilisateur
export async function GET(request: Request) {
  try {
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
    console.error('Error counting active orders:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
} 