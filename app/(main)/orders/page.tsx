'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShoppingBag, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

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

export default function OrdersPage() {
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session?.user) {
        setLoading(false);
        setError('Vous devez être connecté pour voir vos commandes.');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/orders');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la récupération des commandes');
        }

        const data = await response.json();
        setOrders(data);
        setError(null);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des commandes:', err);
        setError(err.message || 'Une erreur est survenue lors du chargement de vos commandes.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    // Déclencher la récupération uniquement si la session est chargée et l'utilisateur est connecté
    if (!isPending) {
       fetchOrders();
    }

  }, [session, isPending]); // Dépendances pour refetch si session change

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!session?.user) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
         <ShoppingBag className="w-16 h-16 text-gray-400 mb-6" />
         <h1 className="text-3xl font-bold text-gray-900 mb-4">Accès refusé</h1>
         <p className="text-lg text-gray-700 mb-8">Vous devez être connecté pour consulter vos commandes.</p>
         <Link href="/auth/login" className="text-red-600 hover:underline font-medium">
           Se connecter
         </Link>
       </div>
     );
   }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes commandes</h1>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mb-6" />
            <p className="text-lg text-gray-600 mb-8">Vous n'avez pas encore passé de commande.</p>
            <Link href="/menu" className="text-red-600 hover:underline font-medium">
              Découvrir notre menu
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