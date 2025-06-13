"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Package,
  X,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);

      if (!productsRes.ok || !categoriesRes.ok) {
        throw new Error("Erreur lors du chargement");
      }

      const [productsData, categoriesData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Produits
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez votre catalogue de produits et leurs informations
          </p>
        </div>
        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link href="/admin/products/add">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un produit
          </Link>
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Produits
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter((p) => p.isAvailable).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Catégories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
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

      {/* Table des produits */}
      <Card>
        <CardHeader>
          <CardTitle>Produits ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Variantes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
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
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="hover:bg-gray-50 cursor-pointer group"
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
                        <TableCell>
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
                              <p className="text-sm text-gray-600 line-clamp-1">
                                {product.description || "Aucune description"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {product.category?.name || "Sans catégorie"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {getVariantRange(product)}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {product.variants?.length || 0} variant(s)
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-right"
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
                                  handleToggleProduct(product.id, !product.isAvailable);
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
