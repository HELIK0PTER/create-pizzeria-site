'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShoppingBag, XCircle, RotateCcw, Truck, Store } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getLastOrder } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

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
  orderItems: OrderItemWithProductAndVariant[];
}

interface LastOrder {
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
    notes?: string | null;
    product: {
      id: string;
      name: string;
      price: number;
      category: { slug: string };
    };
    variant?: { name: string; price: number } | null;
  }>;
  deliveryMethod: "delivery" | "pickup";
  total: number;
  orderDate: string;
  pizzaCount: number;
}

export default function OrdersPage() {
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
  const [showLastOrder, setShowLastOrder] = useState(false);

  // Charger la dernière commande depuis localStorage
  useEffect(() => {
    const loadLastOrder = () => {
      const savedOrder = getLastOrder();
      if (savedOrder) {
        setLastOrder(savedOrder);
      }
    };

    loadLastOrder();
  }, []);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
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

        {/* Dernière commande sauvegardée */}
        {lastOrder && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-orange-600" />
                  {`Dernière commande (sauvegardée)`}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLastOrder(!showLastOrder)}
                >
                  {showLastOrder ? "Masquer" : "Afficher"}
                </Button>
              </div>
            </CardHeader>
            {showLastOrder && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    {lastOrder.deliveryMethod === "delivery" ? (
                      <Truck className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Store className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm font-medium">
                      {lastOrder.deliveryMethod === "delivery" ? "Livraison" : "Click & Collect"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{`Total : `}</span>
                    {formatPrice(lastOrder.total)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{`Pizzas : `}</span>
                    {lastOrder.pizzaCount}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">{`Articles :`}</h4>
                  {lastOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                      <div>
                        <span className="font-medium">{item.product.name}</span>
                        {item.variant && <span className="text-gray-600"> ({item.variant.name})</span>}
                        <span className="text-gray-500"> x{item.quantity}</span>
                      </div>
                      <span className="font-medium">
                        {formatPrice((item.product.price + (item.variant?.price || 0)) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 mt-3">
                  {`Sauvegardée le : ${new Date(lastOrder.orderDate).toLocaleString()}`}
                </p>
              </CardContent>
            )}
          </Card>
        )}

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mb-6" />
            <p className="text-lg text-gray-600 mb-8">{`Vous n'avez pas encore passé de commande.`}</p>
            <Link href="/menu" className="text-red-600 hover:underline font-medium">
              {`Découvrir notre menu`}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
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
                  <div className="space-y-4">
                    <p>--- Début Articles ---</p>
                    {order.orderItems?.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-4">
                        <p>Item:</p>
                        <div className="flex-1">
                          <p className="font-medium">{item.product?.name}{item.variant ? ` (${item.variant.name})` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 