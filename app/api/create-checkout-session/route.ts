import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(req: Request) {
  try {
    // Récupérer les articles du panier et le mode de livraison depuis le corps de la requête
    const { items, deliveryMethod, deliveryFee } = await req.json();

    // Vérifier si le panier est vide
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Le panier est vide' }, { status: 400 });
    }

    // Transformer les articles du panier au format attendu par Stripe
    const line_items = items.map((item: any) => {
      const unit_amount = Math.round((item.product.price + (item.variant?.price || 0)) * 100); // Convertir en centimes

      return {
        price_data: {
          currency: 'eur', // ou votre devise
          product_data: {
            name: item.product.name,
            description: item.variant?.name || item.product.description || undefined,
            images: item.product.image ? [item.product.image] : undefined,
            metadata: {
              productId: item.product.id,
              ...(item.variantId && { variantId: item.variantId }),
            },
          },
          unit_amount: unit_amount,
        },
        quantity: item.quantity,
      };
    });

    // Ajouter les frais de livraison comme un article si la livraison est sélectionnée
    if (deliveryMethod === 'delivery' && deliveryFee > 0) {
      line_items.push({
        price_data: {
          currency: 'eur', // ou votre devise
          product_data: {
            name: 'Frais de livraison',
            description: 'Coût de la livraison à domicile',
          },
          unit_amount: Math.round(deliveryFee * 100), // Convertir en centimes
        },
        quantity: 1,
      });
    }

    // Créer la session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // ou d'autres méthodes si configurées
      line_items: line_items,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/order-canceled`,
      metadata: {
        deliveryMethod: deliveryMethod,
        deliveryFee: deliveryFee ? String(deliveryFee) : '0', // Convertir en string car les métadonnées Stripe sont string/string
      },
    });

    // Retourner l'ID de la session
    return NextResponse.json({ id: session.id });

  } catch (error: any) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 