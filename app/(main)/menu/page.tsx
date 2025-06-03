"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/product/product-card";
import { Category, Product } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Cache de tous les produits
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les données une seule fois au début
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Charger les catégories et tous les produits en parallèle
      const [categoriesResponse, productsResponse] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"), // Récupère TOUS les produits d'un coup
      ]);

      const [categoriesData, productsData] = await Promise.all([
        categoriesResponse.json(),
        productsResponse.json(),
      ]);

      // Trier les produits par ordre de catégorie
      const orderedProducts = (productsData || []).sort(
        (a: Product, b: Product) => {
          const categoryA = categoriesData.find(
            (c: Category) => c.id === a.categoryId
          );
          const categoryB = categoriesData.find(
            (c: Category) => c.id === b.categoryId
          );
          return (categoryA?.order || 0) - (categoryB?.order || 0);
        }
      );

      setCategories(categoriesData || []);
      setAllProducts(orderedProducts); // Cache tous les produits

      // Sélectionner la première catégorie par défaut
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setCategories([]);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);

    // Remonter en haut de la page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filtrage côté client (pas d'appel API)
  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory = selectedCategory
      ? product.categoryId === selectedCategory
      : true;

    const matchesSearch =
      searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.ingredients?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-8">
      <div className="mx-auto px-4">
        <h1 className="ml-[10%] text-4xl font-bold text-gray-900 mb-8">
          Notre Menu
        </h1>

        {/* Barre de recherche */}
        <div className="container mx-auto px-4 mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher une pizza, boisson..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-10 rounded-full border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 rounded-full hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="container mb-8 sticky top-20 left-46 z-10 w-full">
          <div className="flex flex-wrap w-full gap-2 bg-white/80 backdrop-blur-sm p-4 rounded-lg">
            <button
              onClick={() => handleCategoryClick(null)}
              className={cn(
                "px-4 py-2 rounded-full border transition-colors",
                !selectedCategory
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-red-600"
              )}
            >
              Tous les produits
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  "px-4 py-2 rounded-full border transition-colors",
                  selectedCategory === category.id
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-red-600"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 container mx-auto px-4">
          {/* Affichage des résultats de recherche */}
          {searchTerm && (
            <div className="mb-4 text-sm text-gray-600">
              {filteredProducts.length} résultat(s) pour &quot;{searchTerm}
              &quot;
            </div>
          )}

          {/* Grille de produits */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm
                  ? `Aucun produit trouvé pour "${searchTerm}"`
                  : "Aucun produit trouvé dans cette catégorie."}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="mt-4"
                >
                  Effacer la recherche
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
