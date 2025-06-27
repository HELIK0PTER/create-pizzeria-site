// Utilitaires pour la gestion des images avec fallbacks

export const localImageFallbacks: Record<string, string> = {
  // Images de pizzas
  'pizza-1': '/placeholder-food.svg',
  'pizza-2': '/placeholder-food.svg',
  'pizza-3': '/placeholder-food.svg',
  'hero-pizza': '/placeholder-food.svg',
  'about-pizzeria': '/placeholder-food.svg',
  'ingredients': '/placeholder-food.svg',
};

export const getImageWithFallback = (
  originalSrc: string,
  fallbackKey?: string
): string => {
  // Si c'est déjà une image locale, la retourner telle quelle
  if (originalSrc.startsWith('/') || originalSrc.startsWith('data:')) {
    return originalSrc;
  }

  // Pour les images Unsplash qui causent des problèmes, utiliser le fallback
  if (originalSrc.includes('images.unsplash.com')) {
    return fallbackKey && localImageFallbacks[fallbackKey] 
      ? localImageFallbacks[fallbackKey]
      : localImageFallbacks['pizza-1'];
  }

  return originalSrc;
};

export const optimizeUnsplashUrl = (url: string): string => {
  // Optimiser les URLs Unsplash pour de meilleures performances
  if (!url.includes('images.unsplash.com')) {
    return url;
  }

  // Réduire la qualité et la taille pour améliorer les temps de chargement
  const optimizedUrl = url
    .replace(/w=\d+/, 'w=800')
    .replace(/q=\d+/, 'q=75')
    .replace(/&fit=crop/, '&fit=crop&fm=webp');

  return optimizedUrl;
};

// Images placeholder optimisées avec des données base64 légères
export const placeholderImages = {
  pizza: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YzZjRmNiIvPgogIDxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iODAiIGZpbGw9IiNkMWQ1ZGIiLz4KICA8cmVjdCB4PSIzMjAiIHk9IjM1MCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI0MCIgcng9IjIwIiBmaWxsPSIjZDFkNWRiIi8+CiAgPHRleHQgeD0iNDAwIiB5PSIzODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCI+SW1hZ2UgZGUgbm91cnJpdHVyZTwvdGV4dD4KPC9zdmc+',
  food: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YzZjRmNiIvPgogIDxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iODAiIGZpbGw9IiNkMWQ1ZGIiLz4KICA8cmVjdCB4PSIzMjAiIHk9IjM1MCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI0MCIgcng9IjIwIiBmaWxsPSIjZDFkNWRiIi8+CiAgPHRleHQgeD0iNDAwIiB5PSIzODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCI+SW1hZ2UgZGUgbm91cnJpdHVyZTwvdGV4dD4KPC9zdmc+',
}; 