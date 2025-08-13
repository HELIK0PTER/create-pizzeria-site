# 🚚 Gestion des Livreurs - Guide d'utilisation

## Vue d'ensemble

Ce guide explique comment utiliser la nouvelle fonctionnalité de gestion des livreurs dans votre site de pizzeria. Les livreurs peuvent maintenant accéder à une interface dédiée pour gérer les livraisons.

## 🎯 Fonctionnalités

### Pour les Livreurs
- **Tableau de bord** avec statistiques des commandes
- **Gestion des commandes actives** (confirmées, en préparation, prêtes)
- **Suivi des livraisons** en cours
- **Historique des commandes** terminées
- **Mise à jour des statuts** des commandes

### Pour les Administrateurs
- **Promotion d'utilisateurs** en livreurs
- **Gestion des rôles** (customer → delivery → admin)
- **Surveillance** de l'activité des livreurs

## 🔐 Système de Rôles

### Hiérarchie des Rôles
1. **customer** - Utilisateur standard (par défaut)
2. **delivery** - Livreur avec accès aux fonctionnalités de livraison
3. **admin** - Administrateur avec accès complet

### Promotion des Utilisateurs
- **customer** → **delivery** : Accès aux fonctionnalités de livraison
- **delivery** → **admin** : Accès complet à l'administration
- **admin** → **delivery** : Rétrogradation vers les fonctionnalités de livraison
- **delivery** → **customer** : Retour au statut d'utilisateur standard

## 🚀 Installation et Configuration

### 1. Mise à jour de la Base de Données

Exécutez le script de migration pour ajouter le rôle delivery :

```bash
node scripts/add-delivery-role.js
```

### 2. Vérification des Permissions

Assurez-vous que les routes suivantes sont protégées :
- `/livreur` - Accessible uniquement aux livreurs et admins
- `/api/orders/[id]` - API pour mettre à jour les statuts des commandes

## 📱 Interface Livreur

### Accès
- **URL** : `/livreur`
- **Permissions** : Rôle `delivery` ou `admin` requis
- **Redirection** : Vers `/auth/login` si non connecté, vers `/` si permissions insuffisantes

### Fonctionnalités Principales

#### Tableau de Bord
- **Commandes actives** : Nombre de commandes en cours
- **Livraisons en cours** : Commandes en route vers le client
- **Commandes terminées** : Historique des livraisons
- **Total commandes** : Vue d'ensemble

#### Gestion des Commandes
- **Statuts supportés** :
  - `confirmed` : Confirmée
  - `preparing` : En préparation
  - `ready` : Prête pour la livraison
  - `delivering` : En cours de livraison
  - `completed` : Livrée
  - `cancelled` : Annulée

#### Actions Disponibles
- **Commencer livraison** : Changement de statut `ready` → `delivering`
- **Marquer livrée** : Changement de statut `delivering` → `completed`

## 🛠️ Administration

### Interface de Gestion des Utilisateurs
- **Accès** : `/admin/users`
- **Permissions** : Rôle `admin` requis

### Actions de Promotion
1. **Promouvoir en livreur** : `customer` → `delivery`
2. **Promouvoir en admin** : `delivery` → `admin`
3. **Rétrograder** : `admin` → `delivery` ou `delivery` → `customer`

### Sécurité
- **Révocation automatique** des sessions lors du changement de rôle
- **Validation des permissions** sur toutes les routes sensibles
- **Audit trail** des modifications de rôles

## 🔧 API Endpoints

### Mise à jour des Commandes
```http
PATCH /api/orders/[id]
Content-Type: application/json

{
  "status": "delivering"
}
```

**Permissions** : `delivery` ou `admin`
**Statuts valides** : `confirmed`, `preparing`, `ready`, `delivering`, `completed`, `cancelled`

### Récupération des Commandes
```http
GET /api/orders/[id]
```

**Permissions** : `delivery` ou `admin`
**Retour** : Détails complets de la commande avec articles

## 🎨 Personnalisation

### Composants Réutilisables
- `DeliveryCheck` : Vérification des permissions livreur
- `requireDeliveryOrAdmin` : Helper d'authentification
- `requireDeliveryOrAdminAPI` : Helper pour les API routes

### Styles
- **Couleurs** : Orange (#EA580C) pour la cohérence avec le thème
- **Icônes** : Lucide React pour une interface moderne
- **Responsive** : Design adaptatif pour mobile et desktop

## 🚨 Dépannage

### Problèmes Courants

#### Erreur 403 - Accès Refusé
- Vérifiez que l'utilisateur a le rôle `delivery` ou `admin`
- Vérifiez que la session est valide
- Vérifiez les cookies d'authentification

#### Erreur 404 - Page Non Trouvée
- Vérifiez que la route `/livreur` est bien créée
- Vérifiez la structure des dossiers Next.js

#### Erreur de Base de Données
- Vérifiez que le rôle `delivery` est bien ajouté au schéma Prisma
- Exécutez `npx prisma generate` pour mettre à jour le client
- Vérifiez la connexion à la base de données

### Logs et Debug
- **Console navigateur** : Erreurs JavaScript et requêtes API
- **Console serveur** : Logs des API routes et authentification
- **Base de données** : Vérification des rôles utilisateurs

## 📈 Évolutions Futures

### Fonctionnalités Suggérées
- **Géolocalisation** des livreurs
- **Notifications push** pour les nouvelles commandes
- **Historique détaillé** des livraisons
- **Statistiques avancées** (temps de livraison, satisfaction client)
- **Gestion des zones** de livraison
- **Système de bonus** pour les livreurs performants

### Intégrations Possibles
- **Google Maps** pour le suivi des livraisons
- **SMS/Email** pour les notifications clients
- **API externes** pour la gestion des flottes
- **Système de paiement** pour les pourboires

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez ce guide de dépannage
2. Consultez les logs d'erreur
3. Testez avec un utilisateur de test
4. Contactez l'équipe de développement

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Compatibilité** : Next.js 14+, Prisma, Better Auth
