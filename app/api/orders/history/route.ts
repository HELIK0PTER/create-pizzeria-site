import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDeliveryOrAdminAPI } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const { error, status, session } = await requireDeliveryOrAdminAPI(request)
  if (error) {
    return NextResponse.json({ error }, { status: status || 403 })
  }

  try {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'day' // 'day' | 'week' | 'month'

    const now = new Date()
    let from = new Date(now)

    if (period === 'week') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
    } else {
      // day
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    const orders = await prisma.order.findMany({
      where: {
        deliveryMethod: 'delivery',
        delivererId: session!.user.id,
        status: { in: ['completed', 'cancelled'] },
        updatedAt: { gte: from }
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        deliveryAddress: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 200
    })

    return NextResponse.json(orders)
  } catch (e) {
    console.error('Erreur historique livreur:', e)
    return NextResponse.json({ error: 'Erreur lors de la récupération de l\'historique' }, { status: 500 })
  }
}
