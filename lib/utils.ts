import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `CMD${year}${month}${day}${random}`
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

// =================== GESTION DES STATUTS DE COMMANDES ===================

export type OrderStatus = 
  | "pending"       // En attente - Commande créée, paiement en cours
  | "payment_failed"// Paiement échoué 
  | "confirmed"     // Confirmée - Paiement validé
  | "preparing"     // En préparation - Cuisine a commencé
  | "ready"         // Prête - Commande terminée, prête pour collecte/livraison
  | "delivering"    // En livraison - Livreur parti (livraison uniquement)
  | "completed"     // Terminée - Commande livrée/récupérée
  | "cancelled"     // Annulée - Commande annulée

export type DeliveryMethod = "delivery" | "pickup"

export interface OrderStatusInfo {
  label: string
  description: string
  color: string
  icon: string
  nextStates: OrderStatus[]
  autoTransition?: {
    condition: string
    delay?: number // en minutes
  }
  customerVisible: boolean
  notifyCustomer: boolean
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusInfo> = {
  pending: {
    label: "En attente",
    description: "Commande créée, en attente de confirmation de paiement",
    color: "bg-yellow-100 text-yellow-800",
    icon: "Clock",
    nextStates: ["confirmed", "payment_failed", "cancelled"],
    autoTransition: {
      condition: "payment_success",
      delay: 0
    },
    customerVisible: true,
    notifyCustomer: false
  },
  payment_failed: {
    label: "Paiement échoué",
    description: "Le paiement n'a pas pu être traité",
    color: "bg-red-100 text-red-800",
    icon: "XCircle",
    nextStates: ["pending", "cancelled"],
    customerVisible: true,
    notifyCustomer: true
  },
  confirmed: {
    label: "Confirmée",
    description: "Paiement validé, commande transmise en cuisine",
    color: "bg-blue-100 text-blue-800",
    icon: "CheckCircle",
    nextStates: ["preparing", "cancelled"],
    customerVisible: true,
    notifyCustomer: true
  },
  preparing: {
    label: "En préparation",
    description: "La cuisine prépare votre commande",
    color: "bg-purple-100 text-purple-800",
    icon: "ChefHat",
    nextStates: ["ready", "cancelled"],
    customerVisible: true,
    notifyCustomer: true
  },
  ready: {
    label: "Prête",
    description: "Commande terminée, prête pour collecte ou livraison",
    color: "bg-green-100 text-green-800",
    icon: "Package",
    nextStates: ["delivering", "completed", "cancelled"], // delivering seulement pour delivery
    customerVisible: true,
    notifyCustomer: true
  },
  delivering: {
    label: "En livraison",
    description: "Le livreur est en route vers votre adresse",
    color: "bg-orange-100 text-orange-800",
    icon: "Truck",
    nextStates: ["completed", "cancelled"],
    customerVisible: true,
    notifyCustomer: true
  },
  completed: {
    label: "Terminée",
    description: "Commande livrée avec succès",
    color: "bg-emerald-100 text-emerald-800",
    icon: "CheckCircle2",
    nextStates: [], // État final
    customerVisible: true,
    notifyCustomer: true
  },
  cancelled: {
    label: "Annulée",
    description: "Commande annulée",
    color: "bg-red-100 text-red-800",
    icon: "X",
    nextStates: [], // État final
    customerVisible: true,
    notifyCustomer: true
  }
}

// Valide si une transition de statut est autorisée
export function validateStatusTransition(
  currentStatus: OrderStatus, 
  newStatus: OrderStatus,
  deliveryMethod?: DeliveryMethod
): { valid: boolean; reason?: string } {
  const config = ORDER_STATUS_CONFIG[currentStatus]
  
  // Vérifier si la transition est dans les états autorisés
  if (!config.nextStates.includes(newStatus)) {
    return {
      valid: false,
      reason: `Transition de "${config.label}" vers "${ORDER_STATUS_CONFIG[newStatus].label}" non autorisée`
    }
  }
  
  // Règles spéciales pour la livraison
  if (newStatus === "delivering" && deliveryMethod !== "delivery") {
    return {
      valid: false,
      reason: "Le statut 'En livraison' n'est disponible que pour les commandes en livraison"
    }
  }
  
  return { valid: true }
}

// Obtient les prochains statuts possibles pour une commande
export function getNextValidStates(
  currentStatus: OrderStatus,
  deliveryMethod: DeliveryMethod
): OrderStatus[] {
  // Validation pour éviter les erreurs
  if (!currentStatus || !ORDER_STATUS_CONFIG[currentStatus]) {
    console.warn('getNextValidStates: currentStatus invalide:', currentStatus)
    return []
  }
  
  const config = ORDER_STATUS_CONFIG[currentStatus]
  if (!config.nextStates) {
    console.warn('getNextValidStates: nextStates manquant pour', currentStatus)
    return []
  }
  
  const possibleStates = config.nextStates
  
  // Filtrer selon le mode de livraison
  if (deliveryMethod === "pickup") {
    return possibleStates.filter(status => status !== "delivering")
  }
  
  return possibleStates
}

// Calcule le temps estimé pour atteindre un statut
export function getEstimatedTimeForStatus(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  deliveryMethod: DeliveryMethod
): number | null {
  // Temps estimés en minutes
  const timeEstimates: Record<string, number> = {
    'pending->confirmed': 2,
    'confirmed->preparing': 5,
    'preparing->ready': deliveryMethod === "pickup" ? 15 : 20,
    'ready->delivering': 5,
    'ready->completed': 0, // Pour pickup, directement terminé
    'delivering->completed': 25
  }
  
  const key = `${currentStatus}->${targetStatus}`
  return timeEstimates[key] || null
}

// Génère un message de statut pour le client
export function getCustomerStatusMessage(
  status: OrderStatus,
  deliveryMethod: DeliveryMethod,
  estimatedTime?: number
): string {
  const config = ORDER_STATUS_CONFIG[status]
  let message = config.description
  
  if (estimatedTime && status !== "completed" && status !== "cancelled") {
    message += ` (${estimatedTime} min restantes)`
  }
  
  // Messages spéciaux selon le contexte
  switch (status) {
    case "ready":
      if (deliveryMethod === "pickup") {
        message = "Votre commande est prête ! Vous pouvez venir la récupérer."
      } else {
        message = "Votre commande est prête, le livreur va bientôt partir."
      }
      break
    case "delivering":
      message = "Votre commande est en route ! Le livreur arrive dans environ " + (estimatedTime || 25) + " minutes."
      break
    case "completed":
      message = deliveryMethod === "pickup" 
        ? "Merci d'avoir récupéré votre commande ! Bon appétit !"
        : "Votre commande a été livrée ! Bon appétit !"
      break
  }
  
  return message
}

// Détermine si un statut nécessite une notification push/SMS
export function shouldNotifyCustomer(
  oldStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  const config = ORDER_STATUS_CONFIG[newStatus]
  
  // Ne pas notifier pour les transitions automatiques rapides
  if (oldStatus === "pending" && newStatus === "confirmed") {
    return false
  }
  
  return config.notifyCustomer
}

// Estime le temps total de préparation selon les articles
export function estimatePreparationTime(
  items: Array<{ product: { baseType?: string | null }, quantity: number }>
): number {
  let totalTime = 10 // Temps de base

  for (const item of items) {
    if (item.product.baseType) {
      // C'est une pizza - 3 minutes par pizza
      totalTime += item.quantity * 3
    } else {
      // Autre produit - 1 minute par article
      totalTime += item.quantity * 1
    }
  }

  return Math.max(totalTime, 15) // Minimum 15 minutes
}
