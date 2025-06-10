"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { ProductCard } from "@/components/product/product-card";
import { Product } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface FavoriteProduct extends Product {
  id: string;
}

export default function FavoritesPage() {
  const { data: session } = useSession();
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (session === undefined) {
        setLoading(true);
        return;
      }

      if (session === null || !session.user?.id) {
        setLoading(false);
        setError("Veuillez vous connecter pour voir vos favoris.");
        return;
      }

      try {
        const userId = session.user.id;
        const response = await fetch(`/api/favorites?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error("Échec de la récupération des favoris");
        }

        const data = await response.json();
        setFavoriteProducts(data.map((fav: any) => fav.product));
      } catch (err: any) {
        console.error("Erreur lors du chargement des favoris:", err);
        setError(err.message || "Une erreur est survenue lors du chargement de vos favoris.");
        setFavoriteProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-gray-900 mb-8">
            Vos Favoris
          </h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-full w-full sm:w-full flex flex-col flex-1 justify-between group overflow-hidden border-0 shadow-md animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Vos Favoris</h1>
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mx-auto px-4">
        <h1 className="text-center text-4xl font-bold text-gray-900 mb-8">
          Vos Favoris
        </h1>

        {favoriteProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Vous n'avez pas encore de produits favoris.
            </p>
            <p className="text-gray-500 text-md mt-2">
              Cliquez sur le cœur <Heart className="inline-block h-4 w-4 text-orange-500 fill-current" /> sur les produits du menu pour les ajouter ici !
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-6">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
