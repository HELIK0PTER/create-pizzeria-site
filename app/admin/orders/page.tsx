"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart,
  Package,
  Search,
  Filter,
  Clock,
  Truck,
  Store,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Phone,
  Calendar,
  Euro,
  RefreshCw,
  XCircle,
  CheckCircle,
  ChefHat,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatPrice,
  formatDate,
  ORDER_STATUS_CONFIG,
  getNextValidStates,
  OrderStatus,
  DeliveryMethod,
} from "@/lib/utils";
import {
  Order,
  OrderItem,
  Product,
  Variant,
  Category,
  User,
} from "@prisma/client";

// Types étendus pour inclure les relations
interface ExtendedOrderItem extends OrderItem {
  product: Product & { category: Category };
  variant?: Variant | null;
  notes?: string | null;
}

interface ExtendedOrder extends Order {
  orderItems?: ExtendedOrderItem[];
  user?: Pick<User, "id" | "name" | "email"> | null;
}

// Composant pour l'icône du statut
const StatusIcon = ({ status }: { status: OrderStatus }) => {
  const iconMap = {
    pending: Clock,
    payment_failed: XCircle,
    confirmed: CheckCircle,
    preparing: ChefHat,
    ready: Package,
    delivering: Truck,
    completed: CheckCircle2,
    cancelled: X,
  };

  const IconComponent = iconMap[status] || Clock;
  return <IconComponent className="h-4 w-4" />;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const lastOrderCountRef = useRef(0);
  const isfirstload = useRef(true);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryMethodFilter, setDeliveryMethodFilter] =
    useState<string>("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(
    null
  );

  {
    /* Filtrer les commandes */
  }
  const filterOrders = useCallback(() => {
    let filtered = orders;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerEmail
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.customerPhone.includes(searchTerm)
      );
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filtre par méthode de livraison
    if (deliveryMethodFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.deliveryMethod === deliveryMethodFilter
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, deliveryMethodFilter]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  {
    /* Jouer le son de notification */
  }
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/notification.mp3"); // Assurez-vous que ce chemin est correct dans votre dossier /public
      // jouer 3 fois le son de notification
      for (let i = 0; i < 3; i++) {
        audio.play();
        setTimeout(() => {
          audio.pause();
        }, 1000);
      }
    } catch (e) {
      console.error("Erreur lors de la lecture du son de notification:", e);
    }
  }, []);

  {
    /* Récupérer les commandes */
  }
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders?admin=true");
      if (response.ok) {
        const data = await response.json();

        // Vérifier si de nouvelles commandes sont arrivées (uniquement après le chargement initial)
        if (data.length > lastOrderCountRef.current && !isfirstload.current) {
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              playNotificationSound();
            }, i * 300);
          }
        }

        setOrders(data);
        lastOrderCountRef.current = data.length; // Mettre à jour le compte pour la prochaine vérification
        isfirstload.current = false;
      } else {
        console.error("Erreur lors du chargement des commandes");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, [playNotificationSound]);

  {
    /* Actualiser les commandes au chargement de la page */
  }
  useEffect(() => {
    fetchOrders();
    setLoading(false);
  }, [fetchOrders]);

  {
    /* Rafraîchir les commandes toutes les 5 secondes */
  }
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); // Rafraîchissement toutes les 5 secondes

    return () => clearInterval(interval);
  }, [fetchOrders]);

  {
    /* Mettre à jour le statut d'une commande */
  }
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingStatus(orderId);
      setStatusUpdateError(null);

      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }

        // Afficher un message de succès si une notification a été envoyée
        if (responseData.notificationSent) {
          console.log("✅ Notification envoyée au client");
        }
      } else {
        setStatusUpdateError(
          responseData.reason || "Erreur lors de la mise à jour du statut"
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
      setStatusUpdateError("Une erreur est survenue");
    } finally {
      setUpdatingStatus(null);
    }
  };

  {
    /* Afficher le badge du statut */
  }
  const getStatusBadge = (status: OrderStatus) => {
    const statusInfo = ORDER_STATUS_CONFIG[status];
    if (!statusInfo) {
      console.warn("getStatusBadge: statut invalide:", status);
      return <Badge variant="secondary">{status || "Inconnu"}</Badge>;
    }

    return (
      <Badge className={`${statusInfo.color} border-0`} variant="secondary">
        <StatusIcon status={status} />
        <span className="ml-1">{statusInfo.label}</span>
      </Badge>
    );
  };

  {
    /* Afficher l'icône de la méthode de livraison */
  }
  const getDeliveryIcon = (method: string) => {
    return method === "delivery" ? (
      <Truck className="h-4 w-4 text-blue-600" />
    ) : (
      <Store className="h-4 w-4 text-green-600" />
    );
  };

  {
    /* Calculer les statistiques */
  }
  const getOrderStats = () => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;
    const todayOrders = orders.filter(
      (order) =>
        new Date(order.createdAt).toDateString() === new Date().toDateString()
    ).length;

    return { totalOrders, totalRevenue, pendingOrders, todayOrders };
  };

  const getValidStatusOptions = (
    currentStatus: OrderStatus,
    deliveryMethod: DeliveryMethod
  ) => {
    // Validation des paramètres
    if (!currentStatus || !deliveryMethod) {
      console.warn("getValidStatusOptions: paramètres invalides", {
        currentStatus,
        deliveryMethod,
      });
      return [];
    }

    try {
      // Règle spéciale: commandes en mode livraison prêtes ou en cours
      // - Admin peut uniquement annuler
      if (deliveryMethod === 'delivery' && (currentStatus === 'ready' || currentStatus === 'delivering')) {
        return [{
          value: 'cancelled' as unknown as OrderStatus,
          label: ORDER_STATUS_CONFIG['cancelled']?.label || 'Annulée',
          color: ORDER_STATUS_CONFIG['cancelled']?.color || 'bg-gray-100 text-gray-800'
        }]
      }

      const validStates = getNextValidStates(currentStatus, deliveryMethod);
      return validStates.map((status) => ({
        value: status,
        label: ORDER_STATUS_CONFIG[status]?.label || status,
        color:
          ORDER_STATUS_CONFIG[status]?.color || "bg-gray-100 text-gray-800",
      }));
    } catch (error) {
      console.error("Erreur dans getValidStatusOptions:", error, {
        currentStatus,
        deliveryMethod,
      });
      return [];
    }
  };

  {
    /* Afficher les statistiques */
  }
  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-orange-600" />
            {`Gestion des commandes`}
          </h1>
          <p className="text-gray-600 mt-1">
            {`Gérez toutes les commandes de votre pizzeria avec suivi des statuts`}
          </p>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {`Actualiser`}
        </Button>
      </div>

      {/* Alerte d'erreur de mise à jour */}
      {statusUpdateError && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {statusUpdateError}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusUpdateError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{`Commandes aujourd'hui`}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">{`Nouvelles commandes`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{`En attente`}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">{`À traiter`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{`Total commandes`}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">{`Toutes les commandes`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{`Chiffre d'affaires`}</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">{`Total des ventes`}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {`Filtres et recherche`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{`Rechercher`}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Numéro, nom, email, téléphone...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{`Statut`}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={`Tous les statuts`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{`Tous les statuts`}</SelectItem>
                  {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{`Mode de livraison`}</label>
              <Select
                value={deliveryMethodFilter}
                onValueChange={setDeliveryMethodFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Tous les modes`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{`Tous les modes`}</SelectItem>
                  <SelectItem value="delivery">{`Livraison`}</SelectItem>
                  <SelectItem value="pickup">{`Click & Collect`}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>{`Liste des commandes (${filteredOrders.length})`}</CardTitle>
          <CardDescription>
            {`Gérez les statuts et consultez les détails des commandes`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{`Commande`}</TableHead>
                  <TableHead>{`Client`}</TableHead>
                  <TableHead>{`Mode`}</TableHead>
                  <TableHead>{`Statut`}</TableHead>
                  <TableHead>{`Total`}</TableHead>
                  <TableHead>{`Date`}</TableHead>
                  <TableHead>{`Actions`}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      {`Aucune commande trouvée`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    // Validation et normalisation des types
                    const orderStatus = order.status as OrderStatus;
                    const orderDeliveryMethod =
                      order.deliveryMethod as DeliveryMethod;

                    // S'assurer que les valeurs sont valides avant d'appeler getValidStatusOptions
                    const validStatusOptions =
                      orderStatus && orderDeliveryMethod
                        ? getValidStatusOptions(
                            orderStatus,
                            orderDeliveryMethod
                          )
                        : [];

                    return (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-bold">{order.orderNumber}</div>
                            <div className="text-sm text-gray-500">
                              {(order.orderItems || []).reduce(
                                (total: number, item: ExtendedOrderItem) => total + item.quantity,
                                0
                              )}{" "}
                              {`articles`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {order.customerPhone}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDeliveryIcon(order.deliveryMethod)}
                            <span className="text-sm">
                              {order.deliveryMethod === "delivery"
                                ? "Livraison"
                                : "Click & Collect"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {getStatusBadge(order.status as OrderStatus)}
                            {order.status !== 'delivering' && validStatusOptions.length > 0 && (
                              <Select
                                value=""
                                onValueChange={(newStatus) =>
                                  updateOrderStatus(
                                    order.id,
                                    newStatus as OrderStatus
                                  )
                                }
                                disabled={updatingStatus === order.id}
                              >
                                <SelectTrigger className="w-40 h-8 text-xs">
                                  <SelectValue placeholder={order.deliveryMethod === 'delivery' && (order.status === 'ready' || order.status === 'delivering') ? 'Annuler...' : 'Changer...'} />
                                </SelectTrigger>
                                <SelectContent>
                                  {validStatusOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      <div className="flex items-center gap-2">
                                        <StatusIcon
                                          status={option.value as OrderStatus}
                                        />
                                        {option.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatPrice(order.total)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(new Date(order.createdAt))}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Package className="h-5 w-5" />
                                  {`Commande ${order.orderNumber}`}
                                </DialogTitle>
                                <DialogDescription>
                                  {`Détails complets de la commande`}
                                </DialogDescription>
                              </DialogHeader>

                              {selectedOrder && (
                                <div className="space-y-6">
                                  {/* Statut et progression */}
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-3">{`Statut actuel`}</h3>
                                    <div className="flex items-center justify-between">
                                      {getStatusBadge(
                                        selectedOrder.status as OrderStatus
                                      )}
                                      <div className="text-sm text-gray-600">
                                        {
                                          ORDER_STATUS_CONFIG[
                                            selectedOrder.status as OrderStatus
                                          ]?.description
                                        }
                                      </div>
                                    </div>
                                  </div>

                                  {/* Informations client */}
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                      <Phone className="h-4 w-4" />
                                      {`Informations client`}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-600">{`Nom`}</p>
                                        <p className="font-medium">
                                          {selectedOrder.customerName}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">{`Téléphone`}</p>
                                        <p className="font-medium">
                                          <a
                                            href={`tel:${selectedOrder.customerPhone}`}
                                            className="text-blue-600 hover:underline"
                                          >
                                            {selectedOrder.customerPhone}
                                          </a>
                                        </p>
                                      </div>
                                      {selectedOrder.customerEmail && (
                                        <div>
                                          <p className="text-sm text-gray-600">{`Email`}</p>
                                          <p className="font-medium">
                                            {selectedOrder.customerEmail}
                                          </p>
                                        </div>
                                      )}
                                      {selectedOrder.deliveryAddress && (
                                        <div className="col-span-2">
                                          <p className="text-sm text-gray-600">{`Adresse de livraison`}</p>
                                          <p className="font-medium">
                                            {selectedOrder.deliveryAddress}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Détails de la commande */}
                                  <div>
                                    <h3 className="font-semibold mb-3">{`Articles commandés`}</h3>
                                    <div className="space-y-4">
                                      {(() => {
                                        // Grouper les items par catégorie
                                        const itemsByCategory = (selectedOrder.orderItems || []).reduce((acc, item) => {
                                          const categorySlug = item.product.category?.slug || 'other';
                                          if (!acc[categorySlug]) {
                                            acc[categorySlug] = [];
                                          }
                                          acc[categorySlug].push(item);
                                          return acc;
                                        }, {} as Record<string, ExtendedOrderItem[]>);

                                        // Définir l'ordre et les icônes des catégories
                                        const categoryConfig = {
                                          pizzas: { name: 'Pizzas', icon: '🍕', color: 'bg-red-50 border-red-200' },
                                          boissons: { name: 'Boissons', icon: '🥤', color: 'bg-blue-50 border-blue-200' },
                                          desserts: { name: 'Desserts', icon: '🍰', color: 'bg-purple-50 border-purple-200' },
                                          other: { name: 'Autres', icon: '🍽️', color: 'bg-gray-50 border-gray-200' }
                                        };

                                        return Object.entries(itemsByCategory).map(([categorySlug, items]) => {
                                          const config = categoryConfig[categorySlug as keyof typeof categoryConfig] || categoryConfig.other;
                                          
                                          return (
                                            <div key={categorySlug} className={`border rounded-lg p-4 ${config.color}`}>
                                              <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xl">{config.icon}</span>
                                                <h4 className="font-semibold text-lg">{config.name}</h4>
                                                <Badge variant="outline" className="ml-auto">
                                                  {items.reduce((total, item) => total + item.quantity, 0)} articles
                                                </Badge>
                                              </div>
                                              <div className="space-y-2">
                                                {items.map((item, index) => (
                                                  <div
                                                    key={index}
                                                    className="flex justify-between items-center p-3 bg-white rounded border"
                                                  >
                                                    <div>
                                                      <p className="font-medium">
                                                        {item.product.name}
                                                      </p>
                                                      {item.variant && (
                                                        <p className="text-sm text-gray-600">
                                                          {item.variant.name}
                                                        </p>
                                                      )}
                                                      {item.notes && (
                                                        <p className="text-sm text-blue-600">
                                                          Note: {item.notes}
                                                        </p>
                                                      )}
                                                    </div>
                                                    <div className="text-right">
                                                      <p className="font-medium">
                                                        {item.quantity} x{" "}
                                                        {formatPrice(item.unitPrice)}
                                                      </p>
                                                      <p className="text-sm text-gray-600">
                                                        {formatPrice(item.totalPrice)}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>

                                  {/* Total */}
                                  <div className="bg-orange-50 p-4 rounded-lg">
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span>{`Sous-total`}</span>
                                        <span>
                                          {formatPrice(selectedOrder.subTotal)}
                                        </span>
                                      </div>
                                      {selectedOrder.deliveryFee > 0 && (
                                        <div className="flex justify-between">
                                          <span>{`Frais de livraison`}</span>
                                          <span>
                                            {formatPrice(
                                              selectedOrder.deliveryFee
                                            )}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>{`Total`}</span>
                                        <span>
                                          {formatPrice(selectedOrder.total)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  {selectedOrder.notes && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <h3 className="font-semibold mb-2">{`Notes de la commande`}</h3>
                                      <p className="text-gray-700">
                                        {selectedOrder.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
