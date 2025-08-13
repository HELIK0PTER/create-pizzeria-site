"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { DeliveryCheck } from "@/components/auth/delivery-check";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bike,
  Clock,
  MapPin,
  Phone,
  User,
  Package,
  CheckCircle,
  AlertCircle,
  Truck,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  status: string;
  total: number;
  createdAt: string;
  pickupTime?: string;
  updatedAt?: string;
}

interface User {
  name?: string;
  role?: string;
}

function LivreurContent() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [warning, setWarning] = useState<string | null>(null);
  const [confirmSecond, setConfirmSecond] = useState<{ show: boolean; orderId?: string }>( { show: false });

  const formatAddress = (address?: string) => {
    if (!address) return "";
    const parts = address
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const p of parts) {
      const key = p.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(p);
      }
    }
    return deduped.join(", ");
  };

  const getMapsUrl = (address?: string) => {
    const a = formatAddress(address);
    if (!a) return "#";
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a)}`;
  };

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 10000);
    return () => clearInterval(id);
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/history?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setHistoryOrders(Array.isArray(data) ? data : []);
      } else {
        setHistoryOrders([]);
      }
    } catch (error) {
      console.error("Erreur historique:", error);
      setHistoryOrders([]);
    }
  }, [period]);

  useEffect(() => {
    fetchHistory();
  }, [period, fetchHistory]);

  useEffect(() => {
    if (orders.length > 0) {
      setActiveOrders(orders.filter(order => ["ready", "delivering"].includes(order.status)));
      setCompletedOrders([]);
    } else {
      setActiveOrders([]);
      setCompletedOrders([]);
    }
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders/active?list=true");
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Confirmation pour une 2e livraison simultanée (limite 2)
      if (newStatus === 'delivering') {
        const deliveringCount = activeOrders.filter(o => o.status === 'delivering').length;
        if (deliveringCount >= 2) {
          setWarning("Vous avez déjà 2 livraisons en cours. Terminez-en une avant d'en prendre une autre.");
          setTimeout(() => setWarning(null), 5000);
          return;
        }
        if (deliveringCount === 1 && !confirmSecond.show) {
          setConfirmSecond({ show: true, orderId });
          return;
        }
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
        fetchHistory();
        setWarning(null);
      } else {
        const err = await response.json().catch(() => ({}));
        setWarning(err?.error || "Erreur lors de la mise à jour du statut");
        setTimeout(() => setWarning(null), 5000);
        console.error("Erreur lors de la mise à jour du statut:", err?.error || response.statusText);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      setWarning("Erreur lors de la mise à jour du statut");
      setTimeout(() => setWarning(null), 5000);
    } finally {
      if (confirmSecond.show) setConfirmSecond({ show: false });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: string; icon: React.ComponentType<{ className?: string }> }> = {
      confirmed: { label: "Confirmée", variant: "secondary", icon: CheckCircle },
      preparing: { label: "En préparation", variant: "default", icon: Clock },
      ready: { label: "Prête", variant: "default", icon: Package },
      delivering: { label: "En livraison", variant: "default", icon: Truck },
      completed: { label: "Livrée", variant: "default", icon: CheckCircle },
      cancelled: { label: "Annulée", variant: "destructive", icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.confirmed;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as "default" | "secondary" | "destructive" | "outline"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const user = session?.user as User;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bike className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Espace Livreur
                </h1>
                <p className="text-gray-600">
                  Bienvenue, {user?.name} • Gestion des livraisons
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <User className="h-3 w-3 mr-1" />
                {user?.role === "admin" ? "Administrateur" : "Livreur"}
              </Badge>
              <Button variant="outline" onClick={() => window.location.href = "/"}>
                Retour au site
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres historique + Avertissement */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button variant={period === 'day' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('day')}>Jour</Button>
            <Button variant={period === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('week')}>Semaine</Button>
            <Button variant={period === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('month')}>Mois</Button>
          </div>
          {warning && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              <AlertTriangle className="h-4 w-4" />
              {warning}
            </div>
          )}
        </div>

        {/* Popup confirmation 2e livraison (centrée) */}
        <Dialog open={confirmSecond.show} onOpenChange={(open) => setConfirmSecond({ show: open, orderId: open ? confirmSecond.orderId : undefined })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Confirmer la prise d&apos;une 2e livraison
              </DialogTitle>
              <DialogDescription>
                Vous avez déjà une livraison en cours. Êtes-vous sûr de vouloir en prendre une seconde ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmSecond({ show: false })}>Annuler</Button>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => updateOrderStatus(confirmSecond.orderId!, 'delivering')}>Oui, prendre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Commandes actives
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {activeOrders.length}
              </div>
              <p className="text-xs text-muted-foreground">
                En cours de traitement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Livraisons en cours
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {orders.filter(o => o.status === "delivering").length}
              </div>
              <p className="text-xs text-muted-foreground">
                En route vers le client
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Commandes terminées
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {completedOrders.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Livrées aujourd&apos;hui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total commandes
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {orders.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Toutes commandes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commandes actives */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Commandes actives
            </CardTitle>
            <CardDescription>
              Commandes en cours de préparation et prêtes pour la livraison
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="text-blue-600 underline hover:text-blue-700 cursor-pointer transition-colors"
                            >
                              {order.customerPhone}
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <a
                            href={getMapsUrl(order.deliveryAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-700 cursor-pointer transition-colors"
                          >
                            {formatAddress(order.deliveryAddress)}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-medium">
                        {order.total.toFixed(2)} €
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {order.status === "ready" && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "delivering")}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              Prendre la livraison
                            </Button>
                          )}
                          {order.status === "delivering" && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "completed")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Marquer livrée
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune commande active pour le moment</p>
                <p className="text-sm">Les nouvelles commandes apparaîtront ici</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commandes terminées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Historique ({period === 'day' ? 'Aujourd\'hui' : period === 'week' ? '7 derniers jours' : '30 derniers jours'})
            </CardTitle>
            <CardDescription>
              Commandes livrées ou annulées sur la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut final</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customerName}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-medium">
                        {order.total.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun historique sur cette période</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LivreurPage() {
  return (
    <DeliveryCheck>
      <LivreurContent />
    </DeliveryCheck>
  );
}
