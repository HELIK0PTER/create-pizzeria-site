# 🖼️ Guide complet : Gestion des images avec SQLite

## 📋 Vue d'ensemble

Cette application utilise une approche **moderne et optimisée** pour gérer les images :

1. **Base SQLite** : Stocke uniquement les chemins/URLs des images (pas les fichiers binaires)
2. **Système de fichiers** : Images stockées dans `/public/images/`
3. **Optimisation automatique** : Conversion WebP + compression avec Sharp
4. **Upload sécurisé** : Validation de taille, type, et nommage UUID

---

## 🏗️ Architecture

### Structure des dossiers
```
public/images/
├── pizzas/          # Images statiques des pizzas
├── categories/      # Images statiques des catégories  
├── boissons/        # Images statiques des boissons
├── desserts/        # Images statiques des desserts
└── uploads/         # Images uploadées dynamiquement
```

### Schéma de base de données
```sql
-- Les images sont stockées comme des URLs/chemins
Product {
  image: String?  -- Ex: "/images/uploads/uuid.webp"
}

Category {
  image: String?  -- Ex: "/images/categories/pizzas.jpg"
}
```

---

## 🚀 Composants créés

### 1. `ImageUpload` - Composant d'upload
```tsx
<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  onRemove={() => setImageUrl('')}
  maxSize={5}  // MB
/>
```

**Fonctionnalités :**
- Drag & drop
- Preview avec hover overlay
- Validation automatique
- États de loading
- Messages d'erreur

### 2. API Route `/api/upload`
```typescript
POST /api/upload
- Upload multipart/form-data
- Validation (taille, type)
- Optimisation Sharp
- Retourne { url, fileName, sizes }

DELETE /api/upload?fileName=xxx
- Suppression de fichier
```

**Optimisations automatiques :**
- ✅ Conversion en WebP (meilleure compression)
- ✅ Redimensionnement max 800x600px
- ✅ Qualité 85% (bon compromis)
- ✅ Nommage UUID sécurisé

---

## 🔧 Configuration technique

### Installation des dépendances
```bash
npm install sharp  # Optimisation d'images
```

### Variables d'environnement
```env
# Aucune variable spécifique nécessaire pour le stockage local
# Pour un service cloud (optionnel) :
# CLOUDINARY_URL=xxx
# AWS_S3_BUCKET=xxx
```

---

## 💾 Utilisation en base de données

### Dans le seed (images statiques)
```typescript
await prisma.product.create({
  data: {
    name: "Pizza Margherita",
    image: "/images/pizzas/margherita.jpg", // Chemin statique
    // ou
    image: "https://placehold.co/800x600/dc2626/ffffff?text=Pizza", // Placeholder
  }
})
```

### Avec upload dynamique
```typescript
// L'upload retourne une URL
const { url } = await fetch('/api/upload', { ... }).then(r => r.json())

// Stockée en base
await prisma.product.create({
  data: {
    image: url  // Ex: "/images/uploads/abc123.webp"
  }
})
```

---

## 📱 Exemples d'utilisation

### Formulaire basique
```tsx
function ProductForm() {
  const [imageUrl, setImageUrl] = useState('')
  
  return (
    <form>
      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        onRemove={() => setImageUrl('')}
      />
      {/* Autres champs... */}
    </form>
  )
}
```

### Avec validation personnalisée
```tsx
<ImageUpload
  value={product.image}
  onChange={(url) => setProduct(prev => ({...prev, image: url}))}
  onRemove={() => setProduct(prev => ({...prev, image: ''}))}
  maxSize={10}  // 10MB max
  acceptedTypes={['image/jpeg', 'image/png']}  // Pas de WebP
/>
```

---

## 🔒 Sécurité et validation

### Côté client (ImageUpload)
- ✅ Validation de taille (configurable)
- ✅ Validation de type MIME
- ✅ Preview sécurisé

### Côté serveur (API Route)
- ✅ Double validation taille/type
- ✅ Nommage UUID (évite les conflits)
- ✅ Dossier de destination sécurisé
- ✅ Buffer validation

### Fichiers acceptés
```typescript
const allowedTypes = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
]
```

---

## 🚀 Évolutions possibles

### 1. Migration vers le cloud
```typescript
// Cloudinary
import { v2 as cloudinary } from 'cloudinary'

const result = await cloudinary.uploader.upload(file, {
  folder: 'bella-pizza',
  transformation: [
    { width: 800, height: 600, crop: 'limit' },
    { quality: 'auto', format: 'webp' }
  ]
})
```

### 2. Variants multiples
```sql
-- Table pour stocker plusieurs tailles
ProductImage {
  id: String
  productId: String
  variant: String  -- "thumbnail", "medium", "large"
  url: String
  width: Int
  height: Int
}
```

### 3. Lazy loading avancé
```tsx
import Image from 'next/image'

<Image
  src={product.image}
  alt={product.name}
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

---

## 🛠️ Maintenance

### Nettoyage des fichiers orphelins
```typescript
// Script pour supprimer les images non référencées
const orphanFiles = await findOrphanImages()
for (const file of orphanFiles) {
  await fs.unlink(path.join('public', file))
}
```

### Backup des images
```bash
# Sauvegarde simple
tar -czf images-backup-$(date +%Y%m%d).tar.gz public/images/

# Avec rsync pour un serveur distant
rsync -av public/images/ user@server:/backup/images/
```

---

## 📊 Performances

### Avantages de cette approche
- ✅ **SQLite léger** : Pas de BLOB, juste des chemins
- ✅ **CDN ready** : URLs absolues facilement
- ✅ **Cache HTTP** : Images servies par Next.js/serveur web
- ✅ **Optimisation automatique** : WebP + compression

### Métriques typiques
- **Taille originale** : 2-5MB JPG
- **Après optimisation** : 200-500KB WebP
- **Compression** : 80-90% de réduction
- **Performance** : Chargement < 1s

---

## 🎯 Recommandations

### Pour le développement
1. Utilisez les placeholders fournis dans le seed
2. Testez l'upload avec différents formats
3. Vérifiez les optimisations Sharp

### Pour la production
1. Configurez un CDN (Cloudflare, AWS CloudFront)
2. Implémentez un système de backup
3. Monitorer l'espace disque des uploads
4. Considérez migrer vers un service cloud si > 1GB d'images

### Bonnes pratiques
- 📏 **Dimensions cohérentes** : 800x600px pour les produits
- 🎨 **Formats modernes** : WebP automatique
- 🔄 **Lazy loading** : Utilisez Next.js Image
- 🏷️ **Alt text** : Toujours renseigner pour l'accessibilité

---

## 🆘 Dépannage

### Erreur "Sharp not found"
```bash
npm install sharp
# ou pour forcer la recompilation
npm rebuild sharp
```

### Images ne s'affichent pas
1. Vérifiez le chemin dans la DB
2. Confirmez que le fichier existe dans `/public/`
3. Testez l'URL directement dans le navigateur

### Upload échoue
1. Vérifiez la taille (10MB max)
2. Confirmez le type MIME
3. Regardez les logs de l'API route

---

Cette architecture offre un excellent équilibre entre **simplicité**, **performance** et **évolutivité** pour votre site de pizzeria ! 🍕 