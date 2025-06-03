"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Settings,
  BarChart3,
  Eye,
  TrendingUp,
  DollarSign,
  Clock,
  Pizza,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product, Order, Category, Settings as PizzaSettings } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

// Types pour les statistiques
interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todayOrders: number;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<PizzaSettings | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    todayOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes, categoriesRes, settingsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/orders"),
        fetch("/api/categories"),
        fetch("/api/settings"),
      ]);

      const [productsData, ordersData, categoriesData, settingsData] = await Promise.all([
        productsRes.json(),
        ordersRes.json(),
        categoriesRes.json(),
        settingsRes.json(),
      ]);

      setProducts(productsData || []);
      setOrders(ordersData || []);
      setCategories(categoriesData || []);
      setSettings(settingsData || null);

      // Calculer les statistiques
      const totalRevenue = (ordersData || []).reduce(
        (sum: number, order: Order) => sum + order.total,
        0
      );
      const totalOrders = (ordersData || []).length;
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Commandes d'aujourd'hui
      const today = new Date().toDateString();
      const todayOrders = (ordersData || []).filter(
        (order: Order) => new Date(order.createdAt).toDateString() === today
      ).length;

      setStats({
        totalOrders,
        totalRevenue,
        averageOrderValue,
        todayOrders,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "En attente", variant: "secondary" as const },
      confirmed: { label: "Confirmée", variant: "default" as const },
      preparing: { label: "En préparation", variant: "default" as const },
      ready: { label: "Prête", variant: "default" as const },
      delivering: { label: "En livraison", variant: "default" as const },
      completed: { label: "Terminée", variant: "default" as const },
      cancelled: { label: "Annulée", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "secondary" as const,
    };

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Pizza className="h-8 w-8 text-orange-600" />
              Dashboard {settings?.name || "Bella Pizza"}
            </h1>
            <p className="text-gray-600 mt-1">
              Vue d&apos;ensemble de votre pizzeria
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/menu">
                <Eye className="h-4 w-4 mr-2" />
                Voir le site
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Commandes aujourd&apos;hui
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayOrders}</div>
              <p className="text-xs text-muted-foreground">
                Nouvelles commandes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total commandes
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Depuis le lancement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chiffre d&apos;affaires
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">Total généré</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Panier moyen
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.averageOrderValue)}
              </div>
              <p className="text-xs text-muted-foreground">Par commande</p>
            </CardContent>
          </Card>
        </div>

        {/* Aperçus avec onglets */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Commandes récentes
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-2" />
              Produits populaires
            </TabsTrigger>
            <TabsTrigger value="categories">
              <BarChart3 className="h-4 w-4 mr-2" />
              Catégories
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Aperçu Commandes */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dernières commandes</CardTitle>
                    <CardDescription>
                      Aperçu des 5 commandes les plus récentes
                    </CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/admin/orders">
                      Voir toutes les commandes
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Commande</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {orders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucune commande pour le moment
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aperçu Produits */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Produits en vente</CardTitle>
                    <CardDescription>
                      Aperçu de {Math.min(products.length, 8)} produits du menu
                    </CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/admin/products">
                      Voir tous les produits
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.slice(0, 8).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          {categories.find((c) => c.id === product.categoryId)
                            ?.name || "N/A"}
                        </TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.isAvailable ? "default" : "destructive"
                            }
                          >
                            {product.isAvailable
                              ? "Disponible"
                              : "Indisponible"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun produit dans le menu
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aperçu Catégories */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Catégories de produits</CardTitle>
                    <CardDescription>
                      Organisation du menu par catégories
                    </CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/admin/categories">
                      Gérer les catégories
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card key={category.id} className="border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                          {category.name}
                        </CardTitle>
                        <CardDescription>
                          {category.description || "Aucune description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {
                              products.filter(
                                (p) => p.categoryId === category.id
                              ).length
                            }{" "}
                            produits
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Ordre: {category.order}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {categories.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      Aucune catégorie configurée
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aperçu Paramètres */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Configuration générale</CardTitle>
                    <CardDescription>
                      Paramètres actuels de la pizzeria
                    </CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/admin/infos">
                      Modifier les paramètres
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {settings ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Informations générales */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Pizza className="h-5 w-5 text-orange-600" />
                        Informations générales
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Nom</p>
                          <p className="text-base">{settings.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Slogan</p>
                          <p className="text-base">{settings.slogan || "Non défini"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Statut</p>
                          <Badge variant={settings.isOpen ? "default" : "destructive"}>
                            {settings.isOpen ? "Ouvert" : "Fermé"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Phone className="h-5 w-5 text-orange-600" />
                        Contact
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{settings.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{settings.email}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="text-sm">{settings.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Services</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Click & Collect</span>
                          <Badge variant={settings.clickAndCollectEnabled ? "default" : "secondary"}>
                            {settings.clickAndCollectEnabled ? "Activé" : "Désactivé"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Livraison</span>
                          <Badge variant={settings.deliveryEnabled ? "default" : "secondary"}>
                            {settings.deliveryEnabled ? "Activée" : "Désactivée"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Livraison */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Livraison</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Frais de livraison</p>
                          <p className="text-base">{formatPrice(settings.deliveryFee)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Livraison gratuite à partir de</p>
                          <p className="text-base">{formatPrice(settings.freeDeliveryThreshold || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Commande minimum</p>
                          <p className="text-base">{formatPrice(settings.minOrderAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Temps de livraison</p>
                          <p className="text-base">{settings.deliveryTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune configuration trouvée
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Liens rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accès direct aux fonctionnalités de gestion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-16">
                <Link href="/admin/infos" className="flex flex-col gap-2">
                  <Settings className="h-6 w-6" />
                  <span>Paramètres généraux</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16">
                <Link href="/menu" className="flex flex-col gap-2">
                  <Eye className="h-6 w-6" />
                  <span>Voir le site</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16">
                <Link href="/admin/reports" className="flex flex-col gap-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>Rapports détaillés</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
