import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { auth } from '@/lib/auth'

type OrderItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
};

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
          create: items.map((item: OrderItem) => ({
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

export async function GET(req: Request) {
  try {
    // 1. Récupérer l'utilisateur connecté
    const authSession = await auth.api.getSession({
      headers: req.headers,
    });

    if (!authSession?.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userId = authSession.user.id;

    // 2. Récupérer les commandes de l'utilisateur
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        items: {
          include: {
            product: true, // Inclure les détails du produit
            variant: true, // Inclure les détails de la variante si applicable
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Afficher les commandes les plus récentes en premier
      },
    });

    // 3. Retourner les commandes
    return NextResponse.json(orders);

  } catch (error: unknown) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 });
  }
} 