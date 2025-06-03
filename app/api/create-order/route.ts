import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Stripe } from 'stripe';
import { generateOrderNumber } from '@/lib/utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil', // Assurez-vous que cette version correspond à celle utilisée ailleurs
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
        customerPhone: (authSession.user as any).phone ?? '', // Provide empty string if phone is null/undefined
        total: session.amount_total ? session.amount_total / 100 : 0, // Convertir en unité de devise
        status: 'processing', // Ou un statut initial approprié
        stripeSessionId: session.id,
        // Ajoutez d'autres champs de commande si nécessaire (adresse de livraison, mode de livraison, etc.)
        // Ces informations pourraient être stockées dans la session Stripe metadata ou passées dans la requête initiale de création de session
        items: {
          create: session.line_items?.data.map((item: any) => ({
            productId: item.price.product.metadata.productId, // Assurez-vous que l'ID produit est stocké en metadata Stripe
            quantity: item.quantity,
            unitPrice: item.price.unit_amount ? item.price.unit_amount / 100 : 0, // Prix unitaire en devise (depuis Stripe)
            totalPrice: (item.price.unit_amount && item.quantity) ? (item.price.unit_amount / 100) * item.quantity : 0, // Prix total en devise
            variantId: item.price.product.metadata.variantId || null, // ID de la variante si stocké en metadata
            notes: item.description, // Utiliser la description comme notes si applicable
          })),
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

  } catch (error: any) {
    console.error('Erreur lors de la création de la commande:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 