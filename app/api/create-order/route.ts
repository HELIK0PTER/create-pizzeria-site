import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Stripe } from 'stripe';
import { generateOrderNumber } from '@/lib/utils';
import { User } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // 1. Récupérer la session Stripe côté serveur pour vérifier le paiement
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'], // Inclure les détails du produit
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

    // 2. Récupérer l'utilisateur connecté
    const authSession = await auth.api.getSession({
      headers: req.headers,
    });

    if (!authSession?.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userId = authSession.user.id;

    // 3. Créer la commande dans la base de données
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: userId,
        customerName: authSession.user.name,
        customerEmail: authSession.user.email,
        customerPhone: (authSession.user as User).phone ?? '',
        deliveryMethod: 'delivery', // Valeur par défaut
        paymentMethod: 'stripe',
        paymentStatus: 'paid',
        subTotal: session.amount_total ? session.amount_total / 100 : 0,
        total: session.amount_total ? session.amount_total / 100 : 0,
        status: 'confirmed',
        stripeSessionId: session.id,
        items: {
          create: session.line_items?.data.map((item) => {
            const product = item.price?.product as Stripe.Product;
            return {
              productId: product?.metadata?.productId || '',
              quantity: item.quantity || 1,
              unitPrice: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
              totalPrice: (item.price?.unit_amount && item.quantity) ? (item.price.unit_amount / 100) * item.quantity : 0,
              variantId: product?.metadata?.variantId || null,
              notes: null,
            };
          }) || [],
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    // 4. Retourner la confirmation de commande
    return NextResponse.json({ orderId: order.id });

  } catch (error: unknown) {
    console.error('Erreur lors de la création de la commande:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 