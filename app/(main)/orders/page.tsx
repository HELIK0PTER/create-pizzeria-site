'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShoppingBag, XCircle, Truck, Clock, CheckCircle, ChefHat, Package, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, ORDER_STATUS_CONFIG } from '@/lib/utils';
import { Progress } from "@/components/ui/progress"

// Type pour les commandes avec leurs articles et produits/variantes associés
interface OrderItemWithProductAndVariant {
  id: string;
  productId: string;
  product: { name: string; image?: string | null; ingredients?: string | null };
  variantId?: string | null;
  variant?: { name: string } | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItemWithProductAndVariant[];
  subTotal: number;
  deliveryFee: number;
  deliveryMethod: "delivery" | "pickup";
}

const getOrderProgress = (status: string) => {
  const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed']
  const currentIndex = statusOrder.indexOf(status)
  return (currentIndex / (statusOrder.length - 1)) * 100
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />
    case 'confirmed':
      return <CheckCircle className="h-4 w-4" />
    case 'preparing':
      return <ChefHat className="h-4 w-4" />
    case 'ready':
      return <Package className="h-4 w-4" />
    case 'delivering':
      return <Truck className="h-4 w-4" />
    case 'completed':
      return <CheckCircle className="h-4 w-4" />
    case 'cancelled':
      return <X className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export default function OrdersPage() {
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [showAllHistoricalOrders, setShowAllHistoricalOrders] = useState(false);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders?userId=${session.user.id}`);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des commandes');
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [session, isPending]);

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <Alert className="max-w-md mx-auto">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{`Connexion requise`}</AlertTitle>
            <AlertDescription>
              {`Vous devez être connecté pour voir vos commandes.`}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{`Erreur`}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{`Mes commandes`}</h1>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mb-6" />
            <p className="text-lg text-gray-600 mb-8">{`Vous n'avez pas encore passé de commande.`}</p>
            <Link href="/menu" className="text-red-600 hover:underline font-medium">
              {`Découvrir notre menu`}
            </Link>
          </div>
        ) : (
          <>
            {/* Commandes en cours */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{`Commandes en cours`}</h2>
            {
              orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled').length > 0 ? (
                <div className="space-y-6 mb-12">
                  {orders
                    .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
                    .map((order) => (
                      <Card key={order.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-xl font-semibold">Commande #{order.orderNumber || order.id.substring(0, 8)}</CardTitle>
                            <p className="text-sm text-gray-600">Passée le {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="secondary">{order.status}</Badge>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-6">
                          {/* Barre de progression */}
                          {order.status !== 'cancelled' && (
                            <div className="space-y-4 mb-6">
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Progression de la commande</span>
                                <span>{Math.round(getOrderProgress(order.status))}%</span>
                              </div>
                              <Progress value={getOrderProgress(order.status)} className="h-2" />
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(order.status)}
                                  <span>{ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.label || order.status}</span>
                                </div>
                                <p className="text-gray-600">{ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.description}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Articles de la commande */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-gray-600">Articles commandés :</h4>
                            {order.items?.slice(0, expandedOrders.has(order.id) ? undefined : 3).map((item) => (
                              <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {item.product?.image && (
                                    <Image 
                                      src={item.product.image} 
                                      alt={item.product.name}
                                      width={48}
                                      height={48}
                                      className="w-12 h-12 object-cover rounded-md"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{item.product?.name}</p>
                                    {item.variant && (
                                      <p className="text-sm text-gray-600">{item.variant.name}</p>
                                    )}
                                    <p className="text-sm text-gray-500">Quantité : {item.quantity}</p>
                                  </div>
                                </div>
                                <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                              </div>
                            ))}
                            {order.items && order.items.length > 3 && (
                              <Button
                                variant="ghost"
                                className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => toggleOrderExpansion(order.id)}
                              >
                                {expandedOrders.has(order.id) ? 'Voir moins' : `Voir ${order.items.length - 3} article${order.items.length - 3 > 1 ? 's' : ''} de plus`}
                              </Button>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t">
                              <span className="font-medium">Sous-total</span>
                              <span className="font-bold text-lg">{formatPrice(order.subTotal)}</span>
                            </div>
                            {order.deliveryMethod === "delivery" && (
                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-medium text-sm">Frais de livraison</span>
                                    <span className="font-medium text-sm">{formatPrice(order.deliveryFee)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t">
                              <span className="font-medium">Total</span>
                              <span className="font-bold text-lg">
                                {formatPrice(order.total)}
                                {order.deliveryMethod === "delivery" && order.deliveryFee > 0 && (
                                  <span className="text-sm font-normal text-gray-500">{`(dont ${formatPrice(order.deliveryFee)} de frais de livraison)`}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 mb-12">
                  <p className="text-gray-500 text-lg">{`Aucune commande en cours pour le moment.`}</p>
                </div>
              )
            }

            {/* Historique des commandes */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{`Historique des commandes`}</h2>
            {
              orders.filter(order => order.status === 'completed' || order.status === 'cancelled').length > 0 ? (
                <div className="space-y-6">
                  {orders
                    .filter(order => order.status === 'completed' || order.status === 'cancelled')
                    .slice(0, showAllHistoricalOrders ? undefined : 2)
                    .map((order) => (
                      <Card key={order.id} className="opacity-75">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-xl font-semibold">Commande #{order.orderNumber || order.id.substring(0, 8)}</CardTitle>
                            <p className="text-sm text-gray-600">Passée le {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="outline">{ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.label || order.status}</Badge>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-6">
                           {/* Barre de progression */}
                          {order.status !== 'cancelled' && (
                            <div className="space-y-4 mb-6">
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Progression de la commande</span>
                                <span>{Math.round(getOrderProgress(order.status))}%</span>
                              </div>
                              <Progress value={getOrderProgress(order.status)} className="h-2" />
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(order.status)}
                                  <span>{ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.label || order.status}</span>
                                </div>
                                <p className="text-gray-600">{ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]?.description}</p>
                              </div>
                            </div>
                          )}
                           {/* Articles de la commande */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-gray-600">{`Articles :`}</h4>
                            {order.items?.slice(0, expandedOrders.has(order.id) ? undefined : 3).map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {item.product?.image && (
                                    <Image 
                                      src={item.product.image} 
                                      alt={item.product.name}
                                      width={48}
                                      height={48}
                                      className="w-12 h-12 object-cover rounded-md"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{item.product?.name}</p>
                                    {item.variant && <p className="text-sm text-gray-600">{item.variant.name}</p>}
                                    <p className="text-sm text-gray-500">Quantité : {item.quantity}</p>
                                  </div>
                                </div>
                                <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                              </div>
                            ))}
                            {order.items && order.items.length > 3 && (
                              <Button
                                variant="ghost"
                                className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => toggleOrderExpansion(order.id)}
                              >
                                {expandedOrders.has(order.id) ? 'Voir moins' : `Voir ${order.items.length - 3} article${order.items.length - 3 > 1 ? 's' : ''} de plus`}
                              </Button>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t">
                              <span className="font-medium">Sous-total</span>
                              <span className="font-bold text-lg">{formatPrice(order.subTotal)}</span>
                            </div>
                            {order.deliveryMethod === "delivery" && (
                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-medium text-sm">Frais de livraison</span>
                                    <span className="font-medium text-sm">{formatPrice(order.deliveryFee)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t">
                              <span className="font-medium">Total</span>
                              <span className="font-bold text-lg">
                                {formatPrice(order.total)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {orders.filter(order => order.status === 'completed' || order.status === 'cancelled').length > 2 && (
                    <Button
                      variant="outline"
                      className="w-full text-orange-600 hover:text-orange-700 mt-4"
                      onClick={() => setShowAllHistoricalOrders(!showAllHistoricalOrders)}
                    >
                      {showAllHistoricalOrders ? 'Voir moins' : 'Voir plus'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">{`Aucune commande terminée ou annulée.`}</p>
                </div>
              )
            }
          </>
        )}
      </div>
    </div>
  );
} 