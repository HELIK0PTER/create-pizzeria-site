"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Clock, Truck, Store } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Product, Variant, Category } from "@prisma/client";

interface Settings {
  deliveryWaitTimeMin: number;
  deliveryWaitTimeMax: number;
  pickupWaitTimeMin: number;
  pickupWaitTimeMax: number;
  orderSuccessMessage: string;
  phone: string;
  address: string;
}

interface CartItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string | null;
  product: Product & { category: Category };
  variant?: Variant | null;
}

interface LastOrderData {
  items: CartItem[];
  deliveryMethod: "delivery" | "pickup";
  total: number;
  orderDate: string;
  pizzaCount: number;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [lastOrder, setLastOrder] = useState<LastOrderData | null>(null);
  const {
    items,
    deliveryMethod,
    getTotal,
    clearCart,
    saveLastOrder,
    getPizzaItems,
  } = useCart();

  // Capturer les valeurs dans une ref pour éviter les dépendances manquantes
  const cartDataRef = useRef({
    items,
    deliveryMethod,
    getTotal,
    clearCart,
    saveLastOrder,
    getPizzaItems,
  });
  cartDataRef.current = {
    items,
    deliveryMethod,
    getTotal,
    clearCart,
    saveLastOrder,
    getPizzaItems,
  };

  // Charger les settings et les données localStorage
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des settings:", error);
      }
    };

    // Charger les données de la dernière commande
    const loadLastOrder = () => {
      try {
        const saved = localStorage.getItem("lastOrder");
        if (saved) {
          setLastOrder(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la dernière commande:", error);
      }
    };

    fetchSettings();
    loadLastOrder();
  }, []);

  useEffect(() => {
    if (sessionId) {
      const createOrder = async () => {
        try {
          const response = await fetch("/api/create-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Erreur lors de la création de la commande"
            );
          }

          const orderData = await response.json();
          console.log("Commande créée:", orderData);

          // Utiliser les valeurs capturées dans la ref
          const {
            items: currentItems,
            deliveryMethod: currentDeliveryMethod,
            getTotal,
            clearCart,
            saveLastOrder,
            getPizzaItems,
          } = cartDataRef.current;

          // Sauvegarder la dernière commande dans localStorage avant de vider le panier
          const pizzaItems = getPizzaItems();
          const lastOrderData = {
            items: [...currentItems], // Copie des items actuels
            deliveryMethod: currentDeliveryMethod,
            total: getTotal(),
            orderDate: new Date().toISOString(),
            pizzaCount: pizzaItems.reduce(
              (count, item) => count + item.quantity,
              0
            ),
          };

          saveLastOrder(lastOrderData);
          setLastOrder(lastOrderData); // Mettre à jour l'état local aussi
          clearCart();
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error(
              "Erreur lors de la création de la commande:",
              error.message
            );
          } else {
            console.error(
              "Erreur lors de la création de la commande:",
              String(error)
            );
          }
        } finally {
          setLoading(false);
        }
      };

      createOrder();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Utiliser prioritairement les données du localStorage
  const displayPizzaCount = lastOrder?.pizzaCount || items.reduce((count, item) => {
    const isPizza = item.product.category?.slug === "pizzas" || item.product.baseType !== null;
    return isPizza ? count + item.quantity : count;
  }, 0);
  
  const displayDeliveryMethod = lastOrder?.deliveryMethod || deliveryMethod;
  const displayTotal = lastOrder?.total || getTotal();

  const getWaitTimeMessage = () => {
    if (!settings) return "Un temps d'attente sera communiqué";

    if (displayDeliveryMethod === "delivery") {
      const timeRange =
        settings.deliveryWaitTimeMin === settings.deliveryWaitTimeMax
          ? `${settings.deliveryWaitTimeMin} min`
          : `${settings.deliveryWaitTimeMin}-${settings.deliveryWaitTimeMax} min`;
      return `Un temps d'attente de ${timeRange} est estimé pour la livraison`;
    } else {
      const timeRange =
        settings.pickupWaitTimeMin === settings.pickupWaitTimeMax
          ? `${settings.pickupWaitTimeMin} min`
          : `${settings.pickupWaitTimeMin}-${settings.pickupWaitTimeMax} min`;
      return `Un temps d'attente de ${timeRange} est estimé pour le click & collect`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center max-w-2xl mx-auto">
      <CheckCircle className="w-16 h-16 text-green-500 mb-6" />

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {settings?.orderSuccessMessage || "Paiement réussi !"}
      </h1>

      {displayPizzaCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            {displayDeliveryMethod === "delivery" ? (
              <Truck className="w-5 h-5 text-orange-600" />
            ) : (
              <Store className="w-5 h-5 text-orange-600" />
            )}
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-orange-800 font-medium">
            {`Pour votre commande de ${displayPizzaCount} pizza${displayPizzaCount > 1 ? "s" : ""}, ${getWaitTimeMessage()}`}
          </p>
          
          {/* Afficher l'adresse pour le click & collect */}
          {displayDeliveryMethod === "pickup" && settings?.address && (
            <div className="mt-3 pt-3 border-t border-orange-300">
              <p className="text-orange-700 text-sm mb-2">
                {`Adresse de retrait :`}
              </p>
              <a
                href={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-orange-800 font-medium text-sm underline hover:text-orange-900"
              >
                <Store className="w-4 h-4" />
                {settings.address}
              </a>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 mb-6 w-full">
        <h3 className="font-semibold text-gray-900 mb-2">{`Récapitulatif de votre commande`}</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Mode :</strong>{" "}
            {displayDeliveryMethod === "delivery"
              ? "Livraison"
              : "Click & Collect"}
          </p>
          <p>
            <strong>Total :</strong> {formatPrice(displayTotal)}
          </p>
          {sessionId && (
            <p className="text-xs text-gray-500 mt-2">
              Référence : {sessionId.substring(0, 12)}...
            </p>
          )}
        </div>
      </div>

      {/* Message d'assistance */}
      {settings?.phone && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 w-full">
          <p className="text-blue-800 text-sm">
            {`Un problème avec votre commande ? Appelez-nous : `}
            <a 
              href={`tel:${settings.phone.replace(/\s/g, '')}`}
              className="font-semibold underline hover:text-blue-900"
            >
              {settings.phone}
            </a>
          </p>
        </div>
      )}

      <Link
        href="/menu"
        className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
      >
        {`Retourner au menu`}
      </Link>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
