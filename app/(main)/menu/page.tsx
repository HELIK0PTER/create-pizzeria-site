"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/product/product-card";
import { MenuCard } from "@/components/product/menu-card";
import { Category, Product, Menu, MenuProduct, Variant } from "@prisma/client";
import { Search, X, Utensils, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProductWithRelations = Product & {
  category: Category;
  variants: Variant[];
};

type MenuWithProducts = Menu & {
  menuProducts: (MenuProduct & {
    product: Product & {
      category: Category;
      variants: Variant[];
    };
  })[];
};

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<ProductWithRelations[]>([]);
  const [menus, setMenus] = useState<MenuWithProducts[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCompactView, setIsCompactView] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    // Détecter si on est sur mobile et activer la vue compacte par défaut
    const isMobile = window.innerWidth < 768; // breakpoint md de Tailwind
    if (isMobile) {
      setIsCompactView(true);
    }

    // Charger les données une seule fois au début
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Charger les catégories, tous les produits et les menus en parallèle
      const [categoriesResponse, productsResponse, menusResponse] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
        fetch("/api/menus"),
      ]);

      const [categoriesData, productsData, menusData] = await Promise.all([
        categoriesResponse.json(),
        productsResponse.json(),
        menusResponse.json(),
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
      setAllProducts(orderedProducts);
      setMenus(menusData || []);

      // Sélectionner la première catégorie par défaut
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setCategories([]);
      setAllProducts([]);
      setMenus([]);
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
      product.ingredients?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.baseType?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Filtrage des menus par recherche
  const filteredMenus = menus.filter((menu) => {
    if (searchTerm === "") return true;
    
    return (
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.menuProducts.some(mp => 
        mp.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  return (
    <div className="py-8">
      <div className="mx-auto px-4">
        {/* Interface avec onglets */}
        <div className="container mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-white border-2 border-gray-200 p-0 rounded-lg">
              <TabsTrigger 
                value="products" 
                className="flex items-center justify-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:border-orange-500 hover:border-2 transition-all duration-200 rounded-md m-0"
              >
                <Package className="h-4 w-4" />
                Tous les produits
              </TabsTrigger>
              <TabsTrigger 
                value="menus" 
                className="flex items-center justify-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:border-orange-500 hover:border-2 transition-all duration-200 rounded-md m-0"
              >
                <Utensils className="h-4 w-4" />
                Menus ({menus.length})
              </TabsTrigger>
            </TabsList>

            {/* Onglet Produits */}
            <TabsContent value="products" className="space-y-6">
              {/* Barre de recherche, catégories et vue compacte alignés horizontalement */}
              <div className="flex items-center justify-between mb-6">
                {/* Barre de recherche */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder={`Nom, ingrédient, type de base...`}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 pr-10 rounded-full border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white text-gray-900 placeholder-gray-600"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 rounded-full hover:bg-gray-200 text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Filtres par catégorie */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleCategoryClick(null)}
                    className={`px-4 py-2 rounded-full border-2 transition-all duration-200 font-medium ${
                      !selectedCategory
                        ? "bg-orange-500 text-white border-orange-500 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-500 hover:shadow-md"
                    }`}
                  >
                    Toutes les catégories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className={`px-4 py-2 rounded-full border-2 transition-all duration-200 font-medium ${
                        selectedCategory === category.id
                          ? "bg-orange-500 text-white border-orange-500 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-orange-500 hover:shadow-md"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                {/* Vue compacte */}
                <div className="px-4 py-2 rounded-full border-2 border-gray-300 bg-white text-gray-700 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="toggle-menu-view" className="text-sm font-medium text-gray-700">Vue compacte</Label>
                    <Switch
                      id="toggle-menu-view"
                      checked={isCompactView}
                      onCheckedChange={setIsCompactView}
                      className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Affichage des résultats de recherche */}
              {searchTerm && (
                <div className="mb-4 text-sm text-gray-600">
                  {filteredProducts.length} résultat(s) pour &quot;{searchTerm}
                  &quot;
                </div>
              )}

              {/* Grille de produits */}
              {loading ? (
                <div className={`grid ${isCompactView ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"} gap-12`}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className={`grid ${isCompactView ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"} gap-12`}>
                  {filteredProducts.map((product: ProductWithRelations) => (
                    <ProductCard key={product.id} product={product} isCompact={isCompactView} />
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
            </TabsContent>

            {/* Onglet Menus */}
            <TabsContent value="menus" className="space-y-6">
              {/* Affichage des résultats de recherche pour les menus */}
              {searchTerm && (
                <div className="mb-4 text-sm text-gray-600">
                  {filteredMenus.length} menu(s) trouvé(s) pour &quot;{searchTerm}
                  &quot;
                </div>
              )}

              {/* Grille de menus */}
              {loading ? (
                <div className={`grid ${isCompactView ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"} gap-8`}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : filteredMenus.length > 0 ? (
                <div className={`grid ${isCompactView ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"} gap-8`}>
                  {filteredMenus.map((menu: MenuWithProducts) => (
                    <MenuCard key={menu.id} menu={menu} isCompact={isCompactView} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    {searchTerm
                      ? `Aucun menu trouvé pour "${searchTerm}"`
                      : "Aucun menu disponible pour le moment."}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
