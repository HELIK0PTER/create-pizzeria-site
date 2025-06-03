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
        total: session.amount_total ? session.amount_total / 100 : 0, // Convertir en unité de devise
        status: 'processing', // Ou un statut initial approprié
        stripeSessionId: session.id,
        // Les champs suivants récupèrent les valeurs de la session Stripe ou les calculent
        deliveryMethod: session.metadata?.deliveryMethod as string ?? '', // Lire le mode de livraison depuis les métadonnées Stripe et caster en string
        paymentMethod: session.payment_method_types?.[0] as string ?? '', // Lire la méthode de paiement depuis la session Stripe et caster en string
        // Calculer le subTotal en soustrayant les frais de livraison du total
        subTotal: (session.amount_total ? session.amount_total / 100 : 0) - (parseFloat(session.metadata?.deliveryFee as string ?? '0')),
        deliveryFee: parseFloat(session.metadata?.deliveryFee as string ?? '0'), // Lire les frais de livraison depuis les métadonnées
        // paymentStatus est géré par défaut comme 'pending' dans le schema, 'paid' peut être défini ici si le paiement Stripe est confirmé
        paymentStatus: 'paid', // Mettre à jour le statut de paiement basé sur la session Stripe
        items: {
          create: session.line_items?.data
            // Filtrer les articles de ligne pour exclure les frais de livraison et s'assurer que le produit est bien un objet expandé
            ?.filter((item) => (item.description !== 'Frais de livraison' && typeof item.price?.product === 'object' && item.price.product !== null)) // Vérifier que product est un objet non null
            .map((item) => {
            const product = item.price?.product as Stripe.Product; // Assertion de type
            // Accéder aux métadonnées avec vérification optionnelle
            const productId = product?.metadata?.productId || '';
            const variantId = product?.metadata?.variantId || null;

            return {
              productId: productId, // Utiliser l'ID produit vérifié
              quantity: item.quantity || 1,
              unitPrice: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
              totalPrice: (item.price?.unit_amount && item.quantity) ? (item.price.unit_amount / 100) * item.quantity : 0,
              variantId: variantId, // Utiliser l'ID variante vérifié
              notes: null, // Ou récupérer des notes si disponibles
            };
          }) || [], // S'assurer que items.create est un tableau vide si line_items.data est null/undefined
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