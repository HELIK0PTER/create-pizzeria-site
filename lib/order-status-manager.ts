// Gestionnaire avancé des statuts de commandes
import { OrderStatus, DeliveryMethod, ORDER_STATUS_CONFIG, estimatePreparationTime } from './utils'
import { prisma } from '@/lib/prisma'
import { notificationService } from './notification-service'

export interface OrderStatusUpdate {
  orderId: string
  oldStatus: OrderStatus
  newStatus: OrderStatus
  timestamp: Date
  automatic: boolean
  triggeredBy?: string // User ID qui a fait le changement
}

export interface OrderNotification {
  type: 'email' | 'sms' | 'push'
  recipient: string
  message: string
  orderId: string
  status: OrderStatus
  timestamp: Date
}

interface OrderWithDetails {
  id: string
  orderNumber: string
  customerEmail: string | null
  customerPhone: string
  customerName: string
  deliveryMethod: string
  total: number
  status: string
  user?: {
    id: string
    name: string
    email: string
  } | null
  items: Array<{
    id: string
    quantity: number
    product: {
      id: string
      name: string
      price: number
    }
    variant?: {
      id: string
      name: string
      price: number
    } | null
  }>
}

export class OrderStatusManager {
  private statusHistory: Map<string, OrderStatusUpdate[]> = new Map()
  private notificationQueue: OrderNotification[] = []

  // Enregistre un changement de statut dans l'historique
  recordStatusChange(update: OrderStatusUpdate): void {
    const history = this.statusHistory.get(update.orderId) || []
    history.push(update)
    this.statusHistory.set(update.orderId, history)
  }

  // Obtient l'historique des statuts pour une commande
  getStatusHistory(orderId: string): OrderStatusUpdate[] {
    return this.statusHistory.get(orderId) || []
  }

  // Génération et envoi des notifications automatiques
  async generateAndSendNotifications(
    orderId: string,
    newStatus: OrderStatus
  ): Promise<void> {
    try {
      // Générer les notifications
      const notifications = await this.generateNotifications(orderId, newStatus)
      
      if (notifications.length === 0) {
        console.log(`Aucune notification à envoyer pour la commande ${orderId}`)
        return
      }

      // Initialiser le service de notifications
      await notificationService.initialize()

      // Envoyer toutes les notifications
      const results = await notificationService.sendAllNotifications(notifications)
      
      // Logger les résultats
      const successfulEmails = results.emailResults.filter(r => r.success).length
      const failedEmails = results.emailResults.filter(r => !r.success).length
      const successfulSMS = results.smsResults.filter(r => r.success).length
      const failedSMS = results.smsResults.filter(r => !r.success).length

      console.log(`📊 Résultats notifications pour commande ${orderId}:`)
      console.log(`   📧 Emails: ${successfulEmails} envoyés, ${failedEmails} échoués`)
      console.log(`   📱 SMS: ${successfulSMS} envoyés, ${failedSMS} échoués`)

      // Logger les erreurs
      results.emailResults.forEach((result, index) => {
        if (!result.success && result.error) {
          console.error(`❌ Erreur email ${index + 1}:`, result.error)
        }
      })

      results.smsResults.forEach((result, index) => {
        if (!result.success && result.error) {
          console.error(`❌ Erreur SMS ${index + 1}:`, result.error)
        }
      })

    } catch (error) {
      console.error(`Erreur lors de l'envoi des notifications pour la commande ${orderId}:`, error)
    }
  }

  // Génère les notifications pour un changement de statut (code existant amélioré)
  async generateNotifications(
    orderId: string,
    newStatus: OrderStatus
  ): Promise<OrderNotification[]> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      })

      if (!order) {
        console.warn(`Commande ${orderId} introuvable pour les notifications`)
        return []
      }

      const statusConfig = ORDER_STATUS_CONFIG[newStatus]
      const notifications: OrderNotification[] = []

      // Message de base selon le statut
      const baseMessage = this.generateStatusMessage(order, newStatus, statusConfig)

      // Email du client si disponible
      if (order.customerEmail) {
        notifications.push({
          orderId,
          type: 'email',
          recipient: order.customerEmail,
          status: newStatus,
          message: baseMessage,
          timestamp: new Date(),
        })
      }

      // SMS du client si disponible
      if (order.customerPhone) {
        // Message SMS plus court
        const smsMessage = this.generateSMSMessage(order, newStatus, statusConfig)
        notifications.push({
          orderId,
          type: 'sms',
          recipient: order.customerPhone,
          status: newStatus,
          message: smsMessage,
          timestamp: new Date(),
        })
      }

      // Email à l'admin pour certains statuts critiques
      const adminNotificationStatuses: OrderStatus[] = ['confirmed', 'cancelled', 'payment_failed']
      if (adminNotificationStatuses.includes(newStatus)) {
        const adminMessage = this.generateAdminMessage(order, newStatus, statusConfig)
        
        notifications.push({
          orderId,
          type: 'email',
          recipient: 'admin@bellapizza.fr', // TODO: Récupérer depuis settings
          status: newStatus,
          message: adminMessage,
          timestamp: new Date(),
        })
      }

      console.log(`🔔 ${notifications.length} notifications générées pour commande ${orderId} (${newStatus})`)
      return notifications

    } catch (error) {
      console.error(`Erreur lors de la génération des notifications:`, error)
      return []
    }
  }

  // Génère un message SMS court
  private generateSMSMessage(order: OrderWithDetails, status: OrderStatus, statusConfig: { label: string }): string {
    const restaurantName = 'Bella Pizza' // TODO: récupérer depuis settings
    
    switch (status) {
      case 'confirmed':
        return `${restaurantName}: Votre commande #${order.orderNumber} est confirmée ! Préparation en cours. Merci !`
      
      case 'preparing':
        return `${restaurantName}: Votre commande #${order.orderNumber} est en préparation. Bientôt prête !`
      
      case 'ready':
        const isPickup = order.deliveryMethod === 'pickup'
        return isPickup 
          ? `${restaurantName}: Votre commande #${order.orderNumber} est prête ! Vous pouvez venir la récupérer.`
          : `${restaurantName}: Votre commande #${order.orderNumber} est prête et va être livrée !`
      
      case 'delivering':
        return `${restaurantName}: Votre commande #${order.orderNumber} est en route ! Livraison imminente.`
      
      case 'completed':
        return `${restaurantName}: Votre commande #${order.orderNumber} a été livrée. Merci et à bientôt !`
      
      case 'cancelled':
        return `${restaurantName}: Votre commande #${order.orderNumber} a été annulée. Contactez-nous pour plus d'infos.`
      
      case 'payment_failed':
        return `${restaurantName}: Problème de paiement pour votre commande #${order.orderNumber}. Veuillez nous contacter.`
      
      default:
        return `${restaurantName}: Mise à jour de votre commande #${order.orderNumber}: ${statusConfig.label}`
    }
  }

  // Génère un message pour l'admin
  private generateAdminMessage(order: OrderWithDetails, status: OrderStatus, statusConfig: { label: string }): string {
    const customerInfo = order.customerEmail ? `Client: ${order.customerEmail}` : `Commande: ${order.orderNumber}`
    
    switch (status) {
      case 'confirmed':
        return `🍕 NOUVELLE COMMANDE CONFIRMÉE\n\n` +
               `Commande: #${order.orderNumber}\n` +
               `${customerInfo}\n` +
               `Téléphone: ${order.customerPhone || 'Non renseigné'}\n` +
               `Mode: ${order.deliveryMethod === 'delivery' ? 'Livraison' : 'Click & Collect'}\n` +
               `Total: ${order.total}€\n\n` +
               `Préparez cette commande dès que possible !`
      
      case 'cancelled':
        return `❌ COMMANDE ANNULÉE\n\n` +
               `Commande: #${order.orderNumber}\n` +
               `${customerInfo}\n` +
               `Total: ${order.total}€\n\n` +
               `Veuillez vérifier la raison de l'annulation.`
      
      case 'payment_failed':
        return `💳 ÉCHEC DE PAIEMENT\n\n` +
               `Commande: #${order.orderNumber}\n` +
               `${customerInfo}\n` +
               `Total: ${order.total}€\n\n` +
               `Le paiement a échoué. Contactez le client si nécessaire.`
      
      default:
        return `📋 MISE À JOUR COMMANDE\n\n` +
               `Commande: #${order.orderNumber} → ${statusConfig.label}\n` +
               `${customerInfo}`
    }
  }

  // Messages de notification personnalisés
  private getNotificationMessage(
    status: OrderStatus,
    deliveryMethod: DeliveryMethod,
    customerName: string
  ): string {
    const messages: Record<OrderStatus, string> = {
      pending: `Bonjour ${customerName}, votre commande est en attente de confirmation. Nous la traiterons dès que possible.`,
      confirmed: `Bonjour ${customerName}, votre commande a été confirmée et transmise en cuisine. Nous préparons vos délicieuses pizzas !`,
      preparing: `${customerName}, bonne nouvelle ! Nos chefs ont commencé à préparer votre commande avec soin.`,
      ready: deliveryMethod === 'pickup' 
        ? `${customerName}, votre commande est prête ! Vous pouvez venir la récupérer à notre restaurant.`
        : `${customerName}, votre commande est prête ! Notre livreur va bientôt partir pour vous l'apporter.`,
      delivering: `${customerName}, votre commande est en route ! Notre livreur arrive dans environ 25 minutes.`,
      completed: `Merci ${customerName} ! Nous espérons que vous avez apprécié votre repas. À bientôt chez nous !`,
      cancelled: `${customerName}, nous vous informons que votre commande a été annulée. Contactez-nous pour plus d'informations.`,
      payment_failed: `${customerName}, le paiement de votre commande n'a pas pu être traité. Veuillez réessayer ou nous contacter.`
    }

    return messages[status] || ORDER_STATUS_CONFIG[status].description
  }

  // Messages SMS courts
  private getSMSMessage(status: OrderStatus, deliveryMethod: DeliveryMethod): string {
    const messages: Partial<Record<OrderStatus, string>> = {
      ready: deliveryMethod === 'pickup' 
        ? 'Votre commande est prête à récupérer !'
        : 'Votre commande est prête, livraison imminente !',
      delivering: 'Votre commande arrive dans ~25min !',
      completed: 'Commande livrée ! Bon appétit ! 🍕'
    }

    return messages[status] || ORDER_STATUS_CONFIG[status].label
  }

  // Détermine les transitions automatiques possibles
  getAutomaticTransitions(
    currentStatus: OrderStatus,
    orderData: {
      items: Array<{ product: { baseType?: string | null }, quantity: number }>
      paymentStatus?: string
      createdAt: Date
    }
  ): { nextStatus: OrderStatus; delay: number } | null {
    const now = new Date()
    const orderAge = (now.getTime() - new Date(orderData.createdAt).getTime()) / (1000 * 60) // en minutes

    switch (currentStatus) {
      case 'pending':
        // Transition automatique vers confirmed si paiement validé
        if (orderData.paymentStatus === 'paid') {
          return { nextStatus: 'confirmed', delay: 0 }
        }
        // Auto-annulation après 30 minutes sans paiement
        if (orderAge > 30) {
          return { nextStatus: 'cancelled', delay: 0 }
        }
        break

      case 'confirmed':
        // Transition automatique vers preparing après 5 minutes
        if (orderAge > 5) {
          return { nextStatus: 'preparing', delay: 0 }
        }
        break

      case 'preparing':
        // Transition automatique vers ready après le temps de préparation estimé
        const prepTime = estimatePreparationTime(orderData.items)
        if (orderAge > prepTime) {
          return { nextStatus: 'ready', delay: 0 }
        }
        break
    }

    return null
  }

  // Calcule le temps estimé restant pour une commande
  getEstimatedRemainingTime(
    currentStatus: OrderStatus,
    orderData: {
      items: Array<{ product: { baseType?: string | null }, quantity: number }>
      deliveryMethod: DeliveryMethod
      createdAt: Date
    }
  ): number | null {
    const orderAge = (new Date().getTime() - new Date(orderData.createdAt).getTime()) / (1000 * 60)

    switch (currentStatus) {
      case 'pending':
        return 2 // Attente de confirmation

      case 'confirmed':
        return Math.max(5 - orderAge, 0) // 5 min pour démarrer

      case 'preparing':
        const prepTime = estimatePreparationTime(orderData.items)
        return Math.max(prepTime - orderAge, 0)

      case 'ready':
        if (orderData.deliveryMethod === 'pickup') {
          return 0 // Prêt à récupérer
        }
        return 5 // Attente du livreur

      case 'delivering':
        return 25 // Temps de livraison estimé

      default:
        return null
    }
  }

  // Valide qu'un statut peut être changé manuellement
  canManuallyUpdateStatus(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    userRole: string
  ): { allowed: boolean; reason?: string } {
    // Seuls les admins peuvent modifier les statuts
    if (userRole !== 'admin') {
      return { allowed: false, reason: 'Permissions insuffisantes' }
    }

    // Interdire de revenir en arrière sur certains statuts
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      return { allowed: false, reason: 'Impossible de modifier une commande terminée' }
    }

    // Interdire de passer directement à completed sans être passé par ready
    if (targetStatus === 'completed' && !['ready', 'delivering'].includes(currentStatus)) {
      return { allowed: false, reason: 'La commande doit être prête avant d\'être terminée' }
    }

    return { allowed: true }
  }

  // Génère un rapport de statut pour le tableau de bord
  generateStatusReport(orders: Array<{ status: string; createdAt: string; total: number }>): {
    totalOrders: number
    statusBreakdown: Record<OrderStatus, number>
    avgProcessingTime: number
    revenueByStatus: Record<OrderStatus, number>
  } {
    const statusBreakdown = {} as Record<OrderStatus, number>
    const revenueByStatus = {} as Record<OrderStatus, number>
    let totalProcessingTime = 0
    let completedOrders = 0

    // Initialiser les compteurs
    Object.keys(ORDER_STATUS_CONFIG).forEach(status => {
      statusBreakdown[status as OrderStatus] = 0
      revenueByStatus[status as OrderStatus] = 0
    })

    orders.forEach(order => {
      const status = order.status as OrderStatus
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1
      revenueByStatus[status] = (revenueByStatus[status] || 0) + order.total

      // Calculer le temps de traitement pour les commandes terminées
      if (status === 'completed') {
        const processingTime = (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60)
        totalProcessingTime += processingTime
        completedOrders++
      }
    })

    return {
      totalOrders: orders.length,
      statusBreakdown,
      avgProcessingTime: completedOrders > 0 ? totalProcessingTime / completedOrders : 0,
      revenueByStatus
    }
  }

  // Obtient les alertes pour le tableau de bord admin
  getAdminAlerts(orders: Array<{ 
    id: string
    orderNumber: string
    status: string
    createdAt: string
    deliveryMethod: string
    items: Array<{ product: { baseType?: string | null }, quantity: number }>
  }>): Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    orderId: string
    orderNumber: string
  }> {
    const alerts = []
    const now = new Date()

    for (const order of orders) {
      const orderAge = (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60)
      const status = order.status as OrderStatus
      
      // Commandes en attente trop longtemps
      if (status === 'pending' && orderAge > 15) {
        alerts.push({
          type: 'warning' as const,
          message: `Commande en attente depuis ${Math.round(orderAge)} minutes`,
          orderId: order.id,
          orderNumber: order.orderNumber
        })
      }

      // Commandes en préparation trop longtemps
      if (status === 'preparing') {
        const expectedPrepTime = estimatePreparationTime(order.items)
        if (orderAge > expectedPrepTime + 10) {
          alerts.push({
            type: 'error' as const,
            message: `Préparation en retard de ${Math.round(orderAge - expectedPrepTime)} minutes`,
            orderId: order.id,
            orderNumber: order.orderNumber
          })
        }
      }

      // Commandes prêtes depuis longtemps
      if (status === 'ready' && orderAge > (order.deliveryMethod === 'pickup' ? 30 : 15)) {
        alerts.push({
          type: 'warning' as const,
          message: order.deliveryMethod === 'pickup' 
            ? `Commande en attente de récupération depuis ${Math.round(orderAge)} minutes`
            : `Commande prête mais non expédiée depuis ${Math.round(orderAge)} minutes`,
          orderId: order.id,
          orderNumber: order.orderNumber
        })
      }

      // Livraisons en cours depuis trop longtemps
      if (status === 'delivering' && orderAge > 45) {
        alerts.push({
          type: 'error' as const,
          message: `Livraison en cours depuis ${Math.round(orderAge)} minutes`,
          orderId: order.id,
          orderNumber: order.orderNumber
        })
      }
    }

    return alerts
  }

  // Génère un message général selon le statut
  private generateStatusMessage(order: OrderWithDetails, status: OrderStatus, statusConfig: { label: string; description: string }): string {
    const restaurantName = 'Bella Pizza' // TODO: récupérer depuis settings
    
    switch (status) {
      case 'confirmed':
        return `Bonjour ! Votre commande #${order.orderNumber} a été confirmée et transmise en cuisine.\n\n` +
               `Détails de votre commande :\n` +
               `- Mode : ${order.deliveryMethod === 'delivery' ? 'Livraison' : 'Click & Collect'}\n` +
               `- Total : ${order.total}€\n\n` +
               `Nos chefs préparent maintenant vos délicieuses pizzas avec soin. Merci de votre confiance !\n\n` +
               `L'équipe ${restaurantName}`
      
      case 'preparing':
        return `Bonne nouvelle ! Votre commande #${order.orderNumber} est maintenant en cours de préparation.\n\n` +
               `Nos chefs ont commencé à préparer vos pizzas avec les meilleurs ingrédients frais. ` +
               `Nous vous tiendrons informé dès qu'elle sera prête.\n\n` +
               `L'équipe ${restaurantName}`
      
      case 'ready':
        const isPickup = order.deliveryMethod === 'pickup'
        if (isPickup) {
          return `Votre commande #${order.orderNumber} est prête !\n\n` +
                 `Vous pouvez maintenant venir la récupérer à notre restaurant. ` +
                 `N'oubliez pas votre numéro de commande.\n\n` +
                 `Merci et à bientôt !\n` +
                 `L'équipe ${restaurantName}`
        } else {
          return `Votre commande #${order.orderNumber} est prête et va bientôt être livrée !\n\n` +
                 `Notre livreur va partir dans quelques minutes pour vous apporter vos pizzas bien chaudes. ` +
                 `Préparez-vous à régaler !\n\n` +
                 `L'équipe ${restaurantName}`
        }
      
      case 'delivering':
        return `Votre commande #${order.orderNumber} est en route !\n\n` +
               `Notre livreur est parti et arrivera chez vous dans environ 20-30 minutes. ` +
               `Vos pizzas sont bien au chaud et n'attendent que vous !\n\n` +
               `L'équipe ${restaurantName}`
      
      case 'completed':
        return `Votre commande #${order.orderNumber} a été ${order.deliveryMethod === 'delivery' ? 'livrée' : 'récupérée'} avec succès !\n\n` +
               `Nous espérons que vous avez apprécié vos pizzas. ` +
               `N'hésitez pas à nous laisser un avis et à revenir très bientôt !\n\n` +
               `Merci de votre confiance,\n` +
               `L'équipe ${restaurantName}`
      
      case 'cancelled':
        return `Votre commande #${order.orderNumber} a été annulée.\n\n` +
               `Nous nous excusons pour la gêne occasionnée. ` +
               `Si vous avez des questions ou souhaitez repasser commande, n'hésitez pas à nous contacter.\n\n` +
               `L'équipe ${restaurantName}`
      
      case 'payment_failed':
        return `Problème de paiement pour votre commande #${order.orderNumber}.\n\n` +
               `Le paiement n'a pas pu être traité correctement. ` +
               `Veuillez vérifier vos informations bancaires ou essayer un autre moyen de paiement. ` +
               `Vous pouvez aussi nous contacter pour une assistance.\n\n` +
               `L'équipe ${restaurantName}`
      
      default:
        return `Mise à jour de votre commande #${order.orderNumber} : ${statusConfig.label}\n\n` +
               `${statusConfig.description}\n\n` +
               `L'équipe ${restaurantName}`
    }
  }
}

// Instance singleton du gestionnaire
export const orderStatusManager = new OrderStatusManager() 