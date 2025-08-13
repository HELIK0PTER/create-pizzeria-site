import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDeliveryOrAdminAPI } from "@/lib/auth-helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier les permissions livreur ou admin
  const { error, status, session } = await requireDeliveryOrAdminAPI(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = body;

    // Validation du statut
    const validStatuses = [
      "confirmed",
      "preparing", 
      "ready",
      "delivering",
      "completed",
      "cancelled"
    ];

    if (!newStatus || !validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    // Vérifier que la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, deliveryMethod: true }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Seules les commandes en mode livraison sont gérées par les livreurs
    if (existingOrder.deliveryMethod !== 'delivery') {
      return NextResponse.json(
        { error: 'Cette commande n\'est pas en mode livraison' },
        { status: 400 }
      );
    }

    // Règles: livreur peut seulement ready->delivering et delivering->completed
    // Admin peut tout (via d'autres endpoints de gestion si besoin). Ici on tolère admin aussi.
    const current = existingOrder.status;

    // Récupérer l'utilisateur courant
    const currentSession = session!;
    const currentUserId = currentSession!.user.id;

    if (current === 'ready' && newStatus === 'delivering') {
      // Vérifier si le livreur a déjà des commandes en cours (limite: 2)
      const deliveringCount = await prisma.order.count({
        where: {
          delivererId: currentUserId,
          status: 'delivering'
        }
      });

      if (deliveringCount >= 2) {
        return NextResponse.json(
          { error: "Vous avez déjà 2 livraisons en cours. Terminez-en une avant d'en prendre une autre." },
          { status: 400 }
        );
      }

      // Assigner la commande au livreur et passer en delivering
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'delivering',
          delivererId: currentUserId,
          updatedAt: new Date()
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          delivererId: true,
          updatedAt: true,
        }
      });

      return NextResponse.json(updatedOrder);
    }

    if (!(current === 'delivering' && newStatus === 'completed')) {
      return NextResponse.json(
        { error: 'Transition non autorisée pour le livreur' },
        { status: 400 }
      );
    }

    // Mettre à jour le statut delivering -> completed
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        delivererId: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut de la commande' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier les permissions livreur ou admin
  const { error, status } = await requireDeliveryOrAdminAPI(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    );
  }
}
