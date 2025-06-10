import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber, validateStatusTransition, shouldNotifyCustomer, ORDER_STATUS_CONFIG, OrderStatus, DeliveryMethod } from '@/lib/utils'
import { auth } from '@/lib/auth'
import { orderStatusManager } from '@/lib/order-status-manager'

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
    const url = new URL(req.url);
    const isAdminRequest = url.searchParams.get('admin') === 'true';

    // Vérifier si l'utilisateur est admin pour les requêtes admin
    if (isAdminRequest) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      // 2. Récupérer toutes les commandes pour les admins
      const orders = await prisma.order.findMany({
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              },
              variant: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(orders);
    } else {
      // 2. Récupérer les commandes de l'utilisateur connecté
      const orders = await prisma.order.findMany({
        where: {
          userId: userId,
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(orders);
    }

  } catch (error: unknown) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    // 1. Récupérer l'utilisateur connecté
    const authSession = await auth.api.getSession({
      headers: req.headers,
    });

    if (!authSession?.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userId = authSession.user.id;

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    // Récupérer la commande actuelle
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        status: true, 
        deliveryMethod: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true
      }
    });

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Valider la transition de statut
    const validation = validateStatusTransition(
      currentOrder.status as OrderStatus,
      status as OrderStatus,
      currentOrder.deliveryMethod as DeliveryMethod
    );

    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Invalid status transition', 
        reason: validation.reason 
      }, { status: 400 });
    }

    // Mettre à jour le statut de la commande
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            },
            variant: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
      },
    });

    // Vérifier si le client doit être notifié
    const shouldNotify = shouldNotifyCustomer(currentOrder.status as OrderStatus, status as OrderStatus);
    
    if (shouldNotify) {
      // Envoyer les notifications réelles
      try {
        await orderStatusManager.generateAndSendNotifications(
          orderId,
          status as OrderStatus
        )
        console.log(`✅ Notifications envoyées pour commande ${orderId}`)
      } catch (error) {
        console.error(`❌ Erreur envoi notifications:`, error)
        // Ne pas faire échouer la mise à jour pour une erreur de notification
      }
    }

    return NextResponse.json({
      ...updatedOrder,
      statusInfo: ORDER_STATUS_CONFIG[status as OrderStatus],
      notificationSent: shouldNotify
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
  }
} 