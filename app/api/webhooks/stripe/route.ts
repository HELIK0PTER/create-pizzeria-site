import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { orderStatusManager } from '@/lib/order-status-manager'

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
    // Chercher la commande par session ID
    const order = await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
    })

    if (!order) {
      console.log(`⚠️ Aucune commande trouvée pour session ${session.id}`)
      return
    }

    // Mettre à jour le statut si nécessaire
    if (order.status === 'pending') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'confirmed',
          paymentStatus: 'paid',
        },
      })

      // Envoyer les notifications
      try {
        await orderStatusManager.generateAndSendNotifications(order.id, 'confirmed')
        console.log(`✅ Statut mis à jour et notifications envoyées pour commande ${order.orderNumber}`)
      } catch (notificationError) {
        console.error('❌ Erreur notifications:', notificationError)
      }
    } else {
      console.log(`ℹ️ Commande ${order.orderNumber} déjà au statut ${order.status}`)
    }
  } catch (error) {
    console.error('❌ Erreur handlePaymentSuccess:', error)
  }
}

async function handlePaymentIntentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Chercher la commande par payment intent ID
    const order = await prisma.order.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    })

    if (!order) {
      console.log(`⚠️ Aucune commande trouvée pour payment intent ${paymentIntent.id}`)
      return
    }

    // Mettre à jour le statut si nécessaire
    if (order.paymentStatus !== 'paid') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          status: order.status === 'pending' ? 'confirmed' : order.status,
        },
      })

      if (order.status === 'pending') {
        // Envoyer les notifications uniquement si on passe de pending à confirmed
        try {
          await orderStatusManager.generateAndSendNotifications(order.id, 'confirmed')
          console.log(`✅ Paiement confirmé et notifications envoyées pour commande ${order.orderNumber}`)
        } catch (notificationError) {
          console.error('❌ Erreur notifications:', notificationError)
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur handlePaymentIntentSuccess:', error)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Chercher la commande par payment intent ID
    const order = await prisma.order.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    })

    if (!order) {
      console.log(`⚠️ Aucune commande trouvée pour payment intent ${paymentIntent.id}`)
      return
    }

    // Mettre à jour le statut vers payment_failed
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'payment_failed',
        paymentStatus: 'failed',
      },
    })

    // Envoyer les notifications d'échec
    try {
      await orderStatusManager.generateAndSendNotifications(order.id, 'payment_failed')
      console.log(`⚠️ Paiement échoué et notifications envoyées pour commande ${order.orderNumber}`)
    } catch (notificationError) {
      console.error('❌ Erreur notifications:', notificationError)
    }
  } catch (error) {
    console.error('❌ Erreur handlePaymentFailed:', error)
  }
} 