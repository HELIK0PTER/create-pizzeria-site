# 🍕 Pizza Shop - Plateforme E-commerce pour Pizzérias

Une application web moderne et complète pour permettre aux pizzérias d'avoir une présence en ligne avec système de commande intégré.

## 📋 Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [API Endpoints](#api-endpoints)
- [Personnalisation](#personnalisation)
- [Déploiement](#déploiement)
- [Contribution](#contribution)

## 🎯 Aperçu

Pizza Shop est une solution e-commerce clé en main pour les pizzérias souhaitant :

- Attirer plus de clients avec une présence en ligne professionnelle
- Permettre la commande en ligne (livraison et click & collect)
- Gérer facilement leur menu et leurs commandes
- Offrir une expérience utilisateur moderne et responsive

## ✨ Fonctionnalités

### Côté Client

- **Catalogue produits** : Navigation intuitive par catégories (pizzas, boissons, desserts)
- **Variantes produits** : Gestion des tailles et options pour chaque produit
- **Panier intelligent** : Sauvegarde automatique, modification des quantités
- **Modes de commande** : Livraison à domicile ou retrait sur place
- **Interface responsive** : Optimisée pour mobile, tablette et desktop
- **Recherche et filtres** : Trouvez rapidement vos produits préférés

### Côté Admin

- **Tableau de bord** : Vue d'ensemble des ventes et statistiques
- **Gestion du menu** : Ajout/modification/suppression de produits
- **Gestion des disponibilités** : Marquer des produits comme indisponibles
- **Suivi des commandes** : Gestion du statut des commandes en temps réel
- **Configuration du site** : Personnalisation des couleurs, logo, informations

### Fonctionnalités techniques

- **Paiement sécurisé** : Intégration Stripe pour les paiements en ligne
- **Base de données** : SQLite avec Prisma ORM
- **Authentification** : Système de connexion pour les clients et administrateurs
- **API REST** : Architecture moderne et scalable

## 🛠 Technologies utilisées

- **Frontend** :

  - Next.js 15 (App Router)
  - TypeScript
  - Tailwind CSS
  - Zustand (gestion d'état)
  - Lucide React (icônes)
  - Framer Motion (animations)

- **Backend** :

  - Next.js API Routes
  - Prisma ORM
  - SQLite (base de données)
  - Stripe (paiements)

- **Outils** :
  - React Hook Form + Zod (validation)
  - TanStack Query (gestion des requêtes)
  - date-fns (manipulation des dates)

## 📦 Installation

### Prérequis

- Node.js 18+ installé
- npm ou yarn
- Un compte Stripe (pour les paiements)

### Étapes d'installation

1. **Cloner le repository**

```bash
git clone https://github.com/HELIK0PTER/create-pizzeria-site.git
cd create-pizzeria-site
```

2. **Installer les dépendances**

```bash
npm i
```

3. **Configurer les variables d'environnement**
Créez un fichier `.env.local` à la racine du projet :

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-secret-super-secure

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Initialiser la base de données**

```bash
npx prisma db push
npm run seed
```

5. **Lancer le serveur de développement**

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## ⚙️ Configuration

### Configuration Stripe

1. Créez un compte sur [Stripe](https://stripe.com)
2. Récupérez vos clés API dans le dashboard Stripe
3. Configurez le webhook pour recevoir les événements de paiement :
   - URL du webhook : `https://votre-domaine.com/api/stripe/webhook`
   - Événements à écouter : `checkout.session.completed`, `payment_intent.succeeded`

### Configuration initiale

Après l'installation, connectez-vous avec le compte admin par défaut :

- Email : `admin@pizza.fr`
- Mdp : `admin`

⚠️ **Important** : Changez immédiatement ce mot de passe en production !

> * Créez un compte avec votre adresse mail
> * Déconnectez vous puis connectez vous avec le compte admin
> * Donnez vous les droits d'administrateur
> * Déconnectez vous du compte admin et reconnectez vous avec vôtre compte
> * Dans l'interface admin supprimez le compte admin par défaut

## 🚀 Utilisation

### Accès Admin

L'interface d'administration est accessible via `/admin` après connexion avec un compte administrateur.

Fonctionnalités disponibles :

- Dashboard avec statistiques de vente
- Gestion des produits et catégories
- Gestion des commandes
- Configuration du site

### Processus de commande client

1. Parcourir le menu et ajouter des produits au panier
2. Choisir entre livraison ou retrait sur place
3. Remplir les informations de contact
4. Procéder au paiement (Stripe ou espèces à la livraison)
5. Recevoir la confirmation par email

## 📁 Structure du projet

```any
pizza-shop/
├── app/                    # Pages et routes Next.js
│   ├── api/               # API Routes
│   ├── admin/             # Pages administration
│   ├── (main)/            # Pages boutique
│   └── layout.tsx         # Layout principal
├── components/            # Composants React réutilisables
│   ├── ui/               # Composants UI de base
│   ├── layout/           # Composants de layout
│   └── product/          # Composants produits
├── lib/                   # Utilitaires et configuration
├── prisma/               # Schéma et migrations BDD
├── public/               # Assets statiques
├── store/                # Stores Zustand
└── types/                # Types TypeScript
```

## 📡 API Endpoints

### Produits

- `GET /api/products` - Liste des produits
- `GET /api/products/[id]` - Détails d'un produit
- `POST /api/products` - Créer un produit (admin)
- `PUT /api/products/[id]` - Modifier un produit (admin)
- `DELETE /api/products/[id]` - Supprimer un produit (admin)

### Catégories

- `GET /api/categories` - Liste des catégories
- `POST /api/categories` - Créer une catégorie (admin)

### Commandes

- `GET /api/orders` - Liste des commandes (admin)
- `POST /api/orders` - Créer une commande
- `PUT /api/orders/[id]` - Mettre à jour le statut (admin)

### Authentification

- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/logout` - Déconnexion

## 🎨 Personnalisation

### Thème et couleurs

Les couleurs principales peuvent être modifiées dans :

- `tailwind.config.js` pour les couleurs globales
- Table `SiteConfig` en base de données pour une personnalisation dynamique

### Logo et images

- Remplacez `/public/logo.png` par votre logo
- Les images produits peuvent être uploadées via l'interface admin

### Textes et traductions

Tous les textes sont centralisés et peuvent être facilement modifiés pour s'adapter à votre pizzéria.

## 🌐 Déploiement

### Vercel (Recommandé)

1. Poussez votre code sur GitHub
2. Connectez votre repo à Vercel
3. Configurez les variables d'environnement
4. Déployez !

### Autres plateformes

L'application est compatible avec toute plateforme supportant Node.js :

- Netlify
- Railway
- Heroku
- VPS avec PM2

### Base de données en production

Pour la production, nous recommandons de migrer vers PostgreSQL :

1. Modifiez le provider dans `prisma/schema.prisma`
2. Mettez à jour `DATABASE_URL`
3. Exécutez les migrations

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 💡 Support

Pour toute question ou support :

- Ouvrez une issue sur GitHub
- Contactez-nous à <matheuskg.pro@gmail.com>

---

Fait avec ❤️ pour les pizzérias qui veulent se digitaliser
