# 🍕 Guide de Gestion des Statuts de Commandes

## 📋 Vue d'ensemble

Le système de gestion des statuts de commandes permet de suivre précisément l'évolution de chaque commande depuis sa création jusqu'à sa livraison/récupération. Il inclut des transitions automatiques, des validations et des notifications clients.

## 🔄 Cycle de vie d'une commande

### Statuts disponibles

| Statut | Description | Automatique | Notification Client |
|--------|-------------|-------------|-------------------|
| `pending` | En attente de confirmation de paiement | ✅ Stripe webhook | ❌ Non |
| `payment_failed` | Échec du paiement | ✅ Stripe webhook | ✅ Oui |
| `confirmed` | Paiement validé, transmis en cuisine | ✅ Après paiement | ✅ Oui |
| `preparing` | En cours de préparation | ⚠️ Semi-auto | ✅ Oui |
| `ready` | Prête pour collecte/livraison | 👤 Manuel | ✅ Oui |
| `delivering` | En livraison (delivery uniquement) | 👤 Manuel | ✅ Oui |
| `completed` | Terminée/Livrée | 👤 Manuel | ✅ Oui |
| `cancelled` | Annulée | 👤 Manuel | ✅ Oui |

## 🚀 Transitions Automatiques

### 1. `pending` → `confirmed`
```typescript
// Déclenché automatiquement via webhook Stripe
if (paymentStatus === 'paid') {
  updateStatus('confirmed')
}
```

### 2. `pending` → `cancelled`
```typescript
// Auto-annulation après 30 minutes sans paiement
if (orderAge > 30 && paymentStatus !== 'paid') {
  updateStatus('cancelled')
}
```

### 3. `confirmed` → `preparing`
```typescript
// Transition automatique après 5 minutes
if (orderAge > 5) {
  updateStatus('preparing')
}
```

### 4. `preparing` → `ready`
```typescript
// Basé sur le temps de préparation estimé
const estimatedTime = calculatePrepTime(items)
if (orderAge > estimatedTime) {
  suggestStatusUpdate('ready') // Suggestion, pas automatique
}
```

## 🎯 Gestion Manuelle des Statuts

### Interface Admin (`/admin/orders`)

1. **Vue tableau** : Modification rapide via dropdown
2. **Validation des transitions** : Impossible de passer à un statut non autorisé
3. **Messages d'erreur** : Explication claire des restrictions
4. **Indicateurs visuels** : Couleurs et icônes pour chaque statut

### Règles de validation

```typescript
// Exemples de transitions interdites
'completed' → 'any' // ❌ Commande terminée
'cancelled' → 'any' // ❌ Commande annulée
'pending' → 'delivering' // ❌ Doit passer par confirmed, preparing, ready
'pickup' + 'delivering' // ❌ Click & Collect ne peut pas être "en livraison"
```

## 📱 Système de Notifications

### Types de notifications

1. **Email** : Messages détaillés pour tous les statuts importants
2. **SMS** : Messages courts pour `ready`, `delivering`, `completed`
3. **Push** : (Future implémentation)

### Messages personnalisés

```typescript
const messages = {
  confirmed: "Bonjour {name}, votre commande a été confirmée...",
  preparing: "{name}, nos chefs préparent votre commande...",
  ready: "{name}, votre commande est prête !",
  delivering: "{name}, votre commande arrive dans ~25min !",
  completed: "Merci {name} ! Bon appétit ! 🍕"
}
```

## ⚡ Intégration avec le Code

### 1. Import des utilitaires

```typescript
import { 
  OrderStatus, 
  DeliveryMethod,
  ORDER_STATUS_CONFIG,
  validateStatusTransition,
  getNextValidStates,
  getCustomerStatusMessage 
} from '@/lib/utils'

import { orderStatusManager } from '@/lib/order-status-manager'
```

### 2. Validation d'une transition

```typescript
const validation = validateStatusTransition(
  currentStatus,
  newStatus,
  deliveryMethod
)

if (!validation.valid) {
  throw new Error(validation.reason)
}
```

### 3. Génération de notifications

```typescript
const notifications = orderStatusManager.generateNotifications(
  orderId,
  newStatus,
  deliveryMethod,
  { name: customerName, email, phone }
)

// Envoyer les notifications
for (const notification of notifications) {
  await sendNotification(notification)
}
```

### 4. Obtenir les statuts suivants possibles

```typescript
const validStates = getNextValidStates(currentStatus, deliveryMethod)
// Exemple : ['ready', 'cancelled'] pour 'preparing'
```

## 📊 Tableaux de Bord et Alertes

### Alertes automatiques

```typescript
const alerts = orderStatusManager.getAdminAlerts(orders)

// Types d'alertes :
// - ⚠️ Commande en attente > 15min
// - 🚨 Préparation en retard > 10min
// - ⚠️ Commande prête non expédiée > 15min
// - 🚨 Livraison en cours > 45min
```

### Rapports de performance

```typescript
const report = orderStatusManager.generateStatusReport(orders)
/*
{
  totalOrders: 150,
  statusBreakdown: { pending: 5, preparing: 8, ready: 2, ... },
  avgProcessingTime: 23.5, // minutes
  revenueByStatus: { completed: 2450.50, cancelled: 120.00, ... }
}
*/
```

## 🛠️ Comment utiliser le système

### Pour les développeurs

1. **Création d'une commande** : Statut initial `pending`
2. **Webhook Stripe** : Transition automatique vers `confirmed`
3. **Interface admin** : Gestion manuelle des autres transitions
4. **Notifications** : Envoi automatique selon les règles

### Pour les admins

1. **Tableau de bord** : Vue d'ensemble des commandes par statut
2. **Page commandes** : Gestion détaillée avec filtres
3. **Changements de statut** : Dropdown avec options valides uniquement
4. **Alertes** : Notifications pour les commandes en retard

### Pour les clients

1. **Page commandes** : Suivi en temps réel du statut
2. **Notifications** : Email/SMS automatiques
3. **Messages contextuels** : Explications claires selon le mode de livraison

## 📈 Métriques et Optimisations

### Temps de traitement moyens
- **pending → confirmed** : ~2 minutes (automatique)
- **confirmed → preparing** : ~5 minutes (automatique)
- **preparing → ready** : ~15-20 minutes (selon complexité)
- **ready → completed** : ~0-25 minutes (selon mode)

### Optimisations possibles
1. **Prédiction IA** : Estimation dynamique des temps de préparation
2. **Géolocalisation** : Suivi temps réel des livreurs
3. **Analytics** : Identification des goulots d'étranglement
4. **Notifications push** : Engagement client amélioré

## 🔧 Configuration et Personnalisation

### Modifier les temps d'estimation

```typescript
// Dans lib/utils.ts
export function estimatePreparationTime(items) {
  let totalTime = 10 // Temps de base
  
  for (const item of items) {
    if (item.product.baseType) {
      totalTime += item.quantity * 3 // 3 min par pizza
    } else {
      totalTime += item.quantity * 1 // 1 min par autre
    }
  }
  
  return Math.max(totalTime, 15) // Minimum 15 min
}
```

### Ajouter de nouveaux statuts

1. Mettre à jour le type `OrderStatus`
2. Ajouter la configuration dans `ORDER_STATUS_CONFIG`
3. Définir les transitions autorisées
4. Créer les messages de notification
5. Mettre à jour l'interface admin

## 🚨 Gestion des Erreurs

### Erreurs courantes

1. **Transition invalide** : Message explicite à l'admin
2. **Permissions insuffisantes** : Seuls les admins peuvent modifier
3. **Commande inexistante** : Vérification en base
4. **Webhook manqué** : Système de retry automatique

### Monitoring

```typescript
// Logs automatiques pour debug
console.log(`📧 Notification envoyée à ${customerName}`)
console.log(`⚠️ Transition bloquée: ${oldStatus} → ${newStatus}`)
console.log(`🔄 Changement automatique: ${orderNumber}`)
```

Ce système offre une gestion complète et robuste des statuts de commandes avec une excellente expérience utilisateur pour les admins et les clients ! 🎉 