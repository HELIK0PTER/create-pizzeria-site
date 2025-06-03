'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/store/cart';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();

  useEffect(() => {
    if (sessionId) {
      const createOrder = async () => {
        try {
          const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création de la commande');
          }

          const orderData = await response.json();
          console.log('Commande créée:', orderData);
          // Vous pourriez stocker l'orderData dans un état pour l'afficher
        } catch (error: any) {
          console.error('Erreur lors de la création de la commande:', error);
          // Gérer l'erreur, afficher un message à l'utilisateur
        } finally {
          setLoading(false); // Assurez-vous que loading devient false ici après l'appel API
        }
      };

      // Appeler la fonction pour créer la commande
      createOrder();

      console.log('Stripe session ID:', sessionId);
      // Vider le panier après un paiement réussi
      clearCart();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Paiement réussi !</h1>
      <p className="text-lg text-gray-700 mb-8">
        Merci pour votre commande. Votre paiement a été traité avec succès.
      </p>
      {sessionId && (
        <p className="text-sm text-gray-500 mb-8">
          Référence de la session de paiement: {sessionId}
        </p>
      )}
      <Link href="/menu" className="text-red-600 hover:underline font-medium">
        Retourner au menu
      </Link>
    </div>
  );
} 