import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      deliveryMethod,
      pickupTime,
      paymentMethod,
      items,
      subTotal,
      deliveryFee,
      total,
      notes
    } = body

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        deliveryMethod,
        pickupTime: pickupTime ? new Date(pickupTime) : null,
        paymentMethod,
        subTotal,
        deliveryFee,
        total,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    })

    // Si paiement Stripe, créer une session de paiement
    if (paymentMethod === 'stripe') {
      // TODO: Implémenter la création de session Stripe
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de la commande' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
} 