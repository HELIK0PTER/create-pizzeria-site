import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      console.error('❌ Signature Stripe manquante')
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      console.error('❌ Erreur validation webhook Stripe:', err)
      return NextResponse.json({ error: 'Webhook signature invalide' }, { status: 400 })
    }

    console.log(`📧 Webhook Stripe reçu: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status === 'paid') {
          await handlePaymentSuccess(session)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSuccess(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(paymentIntent)
        break
      }

      default:
        console.log(`🔔 Event non géré: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Erreur webhook Stripe:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  try {
    // Note: Pas de champ stripeSessionId dans le modèle Order
    // Cette fonctionnalité nécessiterait d'ajouter ce champ au schéma Prisma
    console.log(`⚠️ Impossible de trouver la commande pour session ${session.id} - champ stripeSessionId manquant`)
    return
  } catch (error) {
    console.error('❌ Erreur handlePaymentSuccess:', error)
  }
}

async function handlePaymentIntentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Note: Pas de champ stripePaymentId dans le modèle Order
    console.log(`⚠️ Impossible de trouver la commande pour payment intent ${paymentIntent.id} - champ stripePaymentId manquant`)
    return
  } catch (error) {
    console.error('❌ Erreur handlePaymentIntentSuccess:', error)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Note: Pas de champ stripePaymentId dans le modèle Order
    console.log(`⚠️ Impossible de trouver la commande pour payment intent ${paymentIntent.id} - champ stripePaymentId manquant`)
    return
  } catch (error) {
    console.error('❌ Erreur handlePaymentFailed:', error)
  }
} 