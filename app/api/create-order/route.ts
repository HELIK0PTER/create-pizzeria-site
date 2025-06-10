import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Stripe } from 'stripe';
import { generateOrderNumber } from '@/lib/utils';
import { User } from '@prisma/client';
import { orderStatusManager } from '@/lib/order-status-manager';

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

    // 2. Récupérer l'utilisateur connecté (optionnel)
    const authSession = await auth.api.getSession({
      headers: req.headers,
    });

    const userId = authSession?.user?.id || null;

    // Utiliser les informations de l'utilisateur connecté ou les métadonnées Stripe
    const customerName = authSession?.user?.name || session.metadata?.customer_full_name || 'Client anonyme';
    const customerEmail = authSession?.user?.email || session.metadata?.customer_email || '';
    const customerPhone = (authSession?.user as User)?.phone || session.metadata?.customer_phone || '';
    const deliveryAddress = session.metadata?.full_delivery_address || '';

    // 3. Vérifier si une commande existe déjà pour cette session
    const existingOrder = await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (existingOrder) {
      // Retourner la commande existante au lieu d'en créer une nouvelle
      return NextResponse.json({ orderId: existingOrder.id, order: existingOrder });
    }

    // 4. Créer la commande dans la base de données avec le statut correct
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: userId, // Peut être null pour les utilisateurs non connectés
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        deliveryAddress: deliveryAddress,
        total: session.amount_total ? session.amount_total / 100 : 0, // Convertir en unité de devise
        status: 'confirmed', // Statut confirmed car le paiement est validé
        stripeSessionId: session.id,
        deliveryMethod: session.metadata?.deliveryMethod as string ?? '', 
        paymentMethod: session.payment_method_types?.[0] as string ?? '', 
        subTotal: (session.amount_total ? session.amount_total / 100 : 0) - (parseFloat(session.metadata?.deliveryFee as string ?? '0')),
        deliveryFee: parseFloat(session.metadata?.deliveryFee as string ?? '0'), 
        paymentStatus: 'paid', // Paiement confirmé
        items: {
          create: session.line_items?.data
            ?.filter((item) => (item.description !== 'Frais de livraison' && typeof item.price?.product === 'object' && item.price.product !== null)) 
            .map((item) => {
            const product = item.price?.product as Stripe.Product; 
            const productId = product?.metadata?.productId || '';
            const variantId = product?.metadata?.variantId || null;

            return {
              productId: productId, 
              quantity: item.quantity || 1,
              unitPrice: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
              totalPrice: (item.price?.unit_amount && item.quantity) ? (item.price.unit_amount / 100) * item.quantity : 0,
              variantId: variantId, 
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

    // 5. Déclencher les notifications pour la nouvelle commande confirmée
    try {
      await orderStatusManager.generateAndSendNotifications(order.id, 'confirmed');
      console.log(`✅ Notifications envoyées pour commande ${order.orderNumber}`);
    } catch (notificationError) {
      console.error('❌ Erreur notifications:', notificationError);
      // Ne pas faire échouer la création de commande si les notifications échouent
    }

    // 6. Retourner la confirmation de commande
    return NextResponse.json({ orderId: order.id });

  } catch (error: unknown) {
    console.error('Erreur lors de la création de la commande:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 