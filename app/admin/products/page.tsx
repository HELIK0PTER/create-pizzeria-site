"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Package,
  X,
  CheckCircle,

  ChefHat,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPrice } from "@/lib/utils";
import { Prisma, Product, Category } from "@prisma/client";
import Image from "next/image";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    variants: true;
  };
}>;

type MenuWithProducts = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  description: string | null;
  isActive?: boolean; // Optionnel car pas dans le schéma actuel
  createdAt: string;
  updatedAt: string;
  menuProducts: Array<{
    id: string;
    type: string;
    allowChoice: boolean;
    minQuantity: number;
    maxQuantity: number;
    product: Product & {
      category: Category;
    };
  }>;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<MenuWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "menus">("products");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, menusRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/menus"),
      ]);

      if (!productsRes.ok || !categoriesRes.ok || !menusRes.ok) {
        throw new Error("Erreur lors du chargement");
      }

      const [productsData, categoriesData, menusData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
        menusRes.json(),
      ]);

      // Trier les produits par ordre de catégorie
      const orderedProducts = productsData.sort((a: Product, b: Product) => {
        const categoryA = categoriesData.find(
          (c: Category) => c.id === a.categoryId
        );
        const categoryB = categoriesData.find(
          (c: Category) => c.id === b.categoryId
        );
        return (categoryA?.order || 0) - (categoryB?.order || 0);
      });

      setProducts(orderedProducts);
      setCategories(categoriesData);
      setMenus(menusData);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        // Si c'est une erreur de contrainte de clé étrangère
        if (response.status === 400 && data.suggestion) {
          const shouldDisable = confirm(
            `${data.error}\n\nVoulez-vous désactiver ce produit à la place ?`
          );

          if (shouldDisable) {
            await handleToggleProduct(productId, false);
            return;
          }
        }
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      // Supprimer le produit de la liste locale
      setProducts(products.filter((p) => p.id !== productId));

      // Message de succès (optionnel)
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du produit"
      );
      console.error(err);
    }
  };

  const handleToggleProduct = async (
    productId: string,
    isAvailable: boolean
  ) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      const updatedProduct = await response.json();

      // Mettre à jour le produit dans la liste locale
      setProducts(
        products.map((p) =>
          p.id === productId
            ? { ...p, isAvailable: updatedProduct.isAvailable }
            : p
        )
      );
    } catch (err) {
      setError("Erreur lors de la mise à jour du produit");
      console.error(err);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      product.categoryId === parseInt(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const filteredMenus = menus.filter((menu) => {
    const matchesSearch =
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.menuProducts.some(mp => 
        mp.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSearch;
  });

  const getVariantRange = (product: ProductWithRelations) => {
    if (!product.variants || product.variants.length === 0) {
      return formatPrice(product.price);
    }

    const prices = product.variants.map((v) => v.price);
    const minPrice = product.price;
    const maxPrice = product.price + Math.max(...prices);

    if (minPrice === maxPrice) {
      return formatPrice(minPrice);
    }

    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  };

  // Pour éviter que le clic sur le menu d'actions ne déclenche la navigation
  const stopRowClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce menu ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/menus/${menuId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      // Supprimer le menu de la liste locale
      setMenus(menus.filter((m) => m.id !== menuId));
      setError("");
    } catch (err) {
      setError("Erreur lors de la suppression du menu");
      console.error(err);
    }
  };

  const getProductCounts = (menu: MenuWithProducts) => {
    const pizzas = menu.menuProducts.filter(mp => mp.type === 'pizza').length;
    const drinks = menu.menuProducts.filter(mp => mp.type === 'drink').length;
    const desserts = menu.menuProducts.filter(mp => mp.type === 'dessert').length;
    return { pizzas, drinks, desserts };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Produits & Menus
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Gérez votre catalogue de produits et menus
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/admin/products/add">
              <Package className="h-4 w-4 mr-2" />
              Ajouter un Produit
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
            <Link href="/admin/menus/add">
              <ChefHat className="h-4 w-4 mr-2" />
              Créer un Menu
            </Link>
          </Button>
        </div>
      </div>

      {/* Onglets */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("products")}
              className={`
                group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center text-sm font-medium hover:text-orange-600 focus:z-10 focus:outline-none
                ${activeTab === "products"
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <Package className={`h-5 w-5 transition-colors ${activeTab === "products" ? "text-orange-600" : "text-gray-400"}`} />
                <span>Produits</span>
                <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">
                  {products.length}
                </Badge>
              </div>
              {activeTab === "products" && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-orange-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("menus")}
              className={`
                group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center text-sm font-medium hover:text-orange-600 focus:z-10 focus:outline-none
                ${activeTab === "menus"
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <ChefHat className={`h-5 w-5 transition-colors ${activeTab === "menus" ? "text-orange-600" : "text-gray-400"}`} />
                <span>Menus</span>
                                 <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">
                   {menus.length}
                 </Badge>
              </div>
              {activeTab === "menus" && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-orange-500" />
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {activeTab === "products" ? (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Package className="h-6 w-6 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">
                      Total Produits
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {products.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Eye className="h-6 w-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Disponibles</p>
                    <p className="text-xl font-bold text-gray-900">
                      {products.filter((p) => p.isAvailable).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Filter className="h-6 w-6 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Catégories</p>
                    <p className="text-xl font-bold text-gray-900">
                      {categories.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <ChefHat className="h-6 w-6 text-orange-600" />
                                     <div className="ml-3">
                     <p className="text-xs font-medium text-gray-600">
                       Total Menus
                     </p>
                     <p className="text-xl font-bold text-gray-900">
                       {menus.length}
                     </p>
                   </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Sparkles className="h-6 w-6 text-yellow-600" />
                                     <div className="ml-3">
                     <p className="text-xs font-medium text-gray-600">Actifs</p>
                     <p className="text-xl font-bold text-gray-900">
                       {menus.filter(m => m.isActive !== false).length}
                     </p>
                   </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                                     <div className="ml-3">
                     <p className="text-xs font-medium text-gray-600">Populaires</p>
                     <p className="text-xl font-bold text-gray-900">
                       {menus.filter(m => m.menuProducts.length > 2).length}
                     </p>
                   </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtres et recherche */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table des produits/menus */}
      <Card>
        <CardHeader>
                     <CardTitle>
             {activeTab === "products" ? `Produits (${filteredProducts.length})` : `Menus (${filteredMenus.length})`}
           </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
          ) : activeTab === "products" ? (
            <div className="rounded-md border">
              <div className="h-[500px] overflow-hidden">
                <div className="sticky top-0 bg-white z-50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="h-12 px-4 text-left align-middle w-[300px]">Produit</th>
                        <th className="hidden md:table-cell h-12 px-4 text-left align-middle w-[150px]">Catégorie</th>
                        <th className="hidden md:table-cell h-12 px-4 text-left align-middle w-[100px]">Prix</th>
                        <th className="h-12 px-4 text-left align-middle w-[120px]">Statut</th>
                        <th className="hidden md:table-cell h-12 px-4 text-left align-middle w-[100px]">Variantes</th>
                        <th className="h-12 px-4 text-right align-middle w-[100px]">Actions</th>
                      </tr>
                    </thead>
                  </table>
                </div>
                <div className="overflow-y-auto h-[calc(500px-48px)]">
                  <table className="w-full text-sm">
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <div className="text-gray-500">
                              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p className="text-lg font-medium">
                                Aucun produit trouvé
                              </p>
                              <p className="text-sm">
                                {searchTerm || selectedCategory !== "all"
                                  ? "Essayez de modifier vos filtres"
                                  : "Commencez par ajouter votre premier produit"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="hover:bg-gray-50 cursor-pointer group border-b"
                            tabIndex={0}
                            onClick={() => {
                              window.location.href = `/admin/products/${product.id}`;
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                window.location.href = `/admin/products/${product.id}`;
                              }
                            }}
                          >
                            <td className="p-4 align-middle w-[300px]">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {product.image ? (
                                    <Image
                                      src={product.image}
                                      alt={product.name}
                                      width={100}
                                      height={100}
                                      className="h-12 w-12 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                      <Package className="h-6 w-6 text-gray-500" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {product.name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="hidden md:table-cell p-4 align-middle w-[150px]">
                              <Badge variant="secondary">
                                {product.category?.name || "Sans catégorie"}
                              </Badge>
                            </td>
                            <td className="hidden md:table-cell p-4 align-middle w-[100px] font-medium text-xs">
                              {getVariantRange(product)}
                            </td>
                            <td className="p-4 align-middle w-[120px]">
                              <Badge
                                variant={
                                  product.isAvailable ? "default" : "secondary"
                                }
                                className={
                                  product.isAvailable
                                    ? "bg-green-100 text-green-800"
                                    : ""
                                }
                              >
                                {product.isAvailable
                                  ? "Disponible"
                                  : "Indisponible"}
                              </Badge>
                            </td>
                            <td className="hidden md:table-cell p-4 align-middle w-[100px] text-center">
                              <span className="text-sm text-gray-600">
                                {product.variants?.length || 0}
                              </span>
                            </td>
                            <td
                              className="p-4 align-middle w-[100px] text-right"
                              onClick={stopRowClick}
                              onKeyDown={stopRowClick}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/products/${product.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Voir les détails
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/admin/products/${product.id}/edit`}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Modifier
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      stopRowClick(e);
                                      handleToggleProduct(
                                        product.id,
                                        !product.isAvailable
                                      );
                                    }}
                                  >
                                    {product.isAvailable ? (
                                      <>
                                        <X className="h-4 w-4 mr-2" />
                                        Marquer comme indisponible
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Marquer comme disponible
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => {
                                      stopRowClick(e);
                                      handleDeleteProduct(product.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
                         // Vue des menus
             <div className="rounded-md border">
               <div className="h-[500px] overflow-hidden">
                 <div className="sticky top-0 bg-white z-50">
                   <table className="w-full text-sm">
                     <thead>
                                               <tr className="border-b">
                          <th className="h-12 px-4 text-left align-middle w-[300px]">Menu</th>
                          <th className="hidden md:table-cell h-12 px-4 text-left align-middle w-[150px]">Type</th>
                          <th className="hidden md:table-cell h-12 px-4 text-left align-middle w-[100px]">Prix</th>
                          <th className="h-12 px-4 text-right align-middle w-[100px]">Actions</th>
                        </tr>
                     </thead>
                   </table>
                 </div>
                 <div className="overflow-y-auto h-[calc(500px-48px)]">
                   <table className="w-full text-sm">
                     <tbody>
                       {filteredMenus.length === 0 ? (
                         <tr>
                           <td colSpan={4} className="text-center py-12">
                             <div className="text-gray-500">
                               <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                               <p className="text-lg font-medium">
                                 Aucun menu trouvé
                               </p>
                               <p className="text-sm mb-4">
                                 {searchTerm
                                   ? "Essayez de modifier vos filtres"
                                   : "Créez votre premier menu pour commencer"}
                               </p>
                               {!searchTerm && (
                                 <Button asChild>
                                   <Link href="/admin/menus/add">
                                     <ChefHat className="h-4 w-4 mr-2" />
                                     Créer un menu
                                   </Link>
                                 </Button>
                               )}
                             </div>
                           </td>
                         </tr>
                       ) : (
                         filteredMenus.map((menu) => {
                           const productCounts = getProductCounts(menu);
                           return (
                             <tr
                               key={menu.id}
                               className="hover:bg-gray-50 cursor-pointer group border-b"
                               tabIndex={0}
                               onClick={() => {
                                 window.location.href = `/admin/menus/${menu.id}`;
                               }}
                               onKeyDown={(e) => {
                                 if (e.key === "Enter" || e.key === " ") {
                                   window.location.href = `/admin/menus/${menu.id}`;
                                 }
                               }}
                             >
                               <td className="p-4 align-middle w-[300px]">
                                 <div className="flex items-center space-x-3">
                                   <div className="flex-shrink-0">
                                     {menu.image ? (
                                       <Image
                                         src={menu.image}
                                         alt={menu.name}
                                         width={100}
                                         height={100}
                                         className="h-12 w-12 rounded-lg object-cover"
                                       />
                                     ) : (
                                       <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                                         <ChefHat className="h-6 w-6 text-orange-600" />
                                       </div>
                                     )}
                                   </div>
                                   <div>
                                     <p className="font-medium text-gray-900">
                                       {menu.name}
                                     </p>
                                     {menu.description && (
                                       <p className="text-xs text-gray-500 mt-1">
                                         {menu.description}
                                       </p>
                                     )}
                                   </div>
                                 </div>
                               </td>
                               <td className="hidden md:table-cell p-4 align-middle w-[150px]">
                                 <div className="flex flex-wrap gap-1">
                                   {productCounts.pizzas > 0 && (
                                     <Badge variant="secondary" className="text-xs">
                                       {productCounts.pizzas} Pizza{productCounts.pizzas > 1 ? 's' : ''}
                                     </Badge>
                                   )}
                                   {productCounts.drinks > 0 && (
                                     <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                       {productCounts.drinks} Boisson{productCounts.drinks > 1 ? 's' : ''}
                                     </Badge>
                                   )}
                                   {productCounts.desserts > 0 && (
                                     <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                                       {productCounts.desserts} Dessert{productCounts.desserts > 1 ? 's' : ''}
                                     </Badge>
                                   )}
                                 </div>
                               </td>
                                                                                               <td className="hidden md:table-cell p-4 align-middle w-[100px] font-medium text-xs">
                                  {formatPrice(menu.price)}
                                </td>
                               <td
                                 className="p-4 align-middle w-[100px] text-right"
                                 onClick={stopRowClick}
                                 onKeyDown={stopRowClick}
                               >
                                 <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                     <Button variant="ghost" className="h-8 w-8 p-0">
                                       <MoreHorizontal className="h-4 w-4" />
                                     </Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end">
                                     <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                     <DropdownMenuItem asChild>
                                       <Link href={`/admin/menus/${menu.id}`}>
                                         <Eye className="h-4 w-4 mr-2" />
                                         Voir les détails
                                       </Link>
                                     </DropdownMenuItem>
                                                                           <DropdownMenuItem asChild>
                                        <Link href={`/admin/menus/${menu.id}`}>
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Modifier
                                        </Link>
                                      </DropdownMenuItem>
                                     <DropdownMenuSeparator />
                                     <DropdownMenuItem
                                       className="text-red-600"
                                       onClick={(e) => {
                                         stopRowClick(e);
                                         handleDeleteMenu(menu.id);
                                       }}
                                     >
                                       <Trash2 className="h-4 w-4 mr-2" />
                                       Supprimer
                                     </DropdownMenuItem>
                                   </DropdownMenuContent>
                                 </DropdownMenu>
                               </td>
                             </tr>
                           );
                         })
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
