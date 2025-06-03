'use client';

import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function OrderCanceledPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <XCircle className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Paiement Annulé</h1>
      <p className="text-lg text-gray-700 mb-8">
        {`Votre paiement n'a pas été traité. Vous pouvez retourner à votre panier pour vérifier votre commande ou réessayer.`}
      </p>
      <Link href="/cart" className="text-red-600 hover:underline font-medium">
        Retourner au panier
      </Link>
    </div>
  );
} 