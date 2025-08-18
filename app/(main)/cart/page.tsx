"use client";

import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, Gift } from "lucide-react";
import { useCart, usePromotionSettings } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from "lucide-react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    menuItems,
    removeItem,
    removeMenuItem,
    updateQuantity,
    updateMenuQuantity,
    getSubTotal,
    getTotal,
    deliveryMethod,
    setDeliveryMethod,
    deliveryFee,
    getPromotionApplied,
    getPromotionDiscount,
  } = useCart();

  // Charger les settings de promotion
  usePromotionSettings();

  const promotionApplied = getPromotionApplied();
  const promotionDiscount = getPromotionDiscount();

  const handleQuantityChange = (
    productId: string,
    variantId: string | null | undefined,
    delta: number
  ) => {
    const item = items.find(
      (i) => i.productId === productId && i.variantId === variantId
    );
    if (item) {
      updateQuantity(productId, variantId, item.quantity + delta);
    }
  };

  const handleProceedToCheckout = () => {
    router.push("/checkout");
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{`Votre panier`}</h1>

        {/* Message d'annulation de paiement */}
        <Suspense>
          <PaymentCanceled />
        </Suspense>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Liste des articles */}
          {items.length === 0 && menuItems.length === 0 && (
            <div className="lg:col-span-2 space-y-4">
              <p className="text-gray-600">{`Votre panier est vide.`}</p>
              <Link href="/menu" className="text-red-600 hover:underline">
                {`Voir la carte ici`}
              </Link>
            </div>
          )}
          {(items.length > 0 || menuItems.length > 0) && (
            <div className="lg:col-span-2 space-y-4">
              {/* Affichage de la promotion si applicable */}
              {promotionApplied && (
                <Alert className="border-green-200 bg-green-50">
                  <Gift className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">
                    {`🎉 Promotion appliquée !`}
                  </AlertTitle>
                  <AlertDescription className="text-green-700">
                    {`${promotionApplied.description} -> ${promotionApplied.pizzasFree} pizza${promotionApplied.pizzasFree > 1 ? 's' : ''} gratuite${promotionApplied.pizzasFree > 1 ? 's' : ''} !`}
                    <br />
                    <span className="font-semibold">
                      {`Économie : ${formatPrice(promotionDiscount)}`}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {items.map((item) => {
                const basePrice = item.product.price;
                const variantPrice = item.variant?.price || 0;
                const totalPrice = basePrice + variantPrice;
                const isPizza = item.product.category?.slug === "pizzas" || item.product.baseType !== null;
                
                return (
                  <Card key={`${item.productId}-${item.variantId}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-3xl">
                            {item.product.image ? (
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                width={80}
                                height={80}
                                className="rounded-lg"
                              />
                            ) : (
                              <span className="text-3xl">🍕</span>
                            )}
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <h3 className="font-semibold text-lg">
                              {item.product.name}
                            </h3>
                            {isPizza && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                🍕 Pizza
                              </span>
                            )}
                          </div>
                          {item.variant && (
                            <p className="text-sm text-gray-600">
                              {item.variant.name}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-sm text-gray-500 mt-1">
                              {item.notes}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.productId,
                                    item.variantId,
                                    -1
                                  )
                                }
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.productId,
                                    item.variantId,
                                    1
                                  )
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="font-semibold">
                                {formatPrice(totalPrice * item.quantity)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeItem(
                                    item.productId,
                                    item.variantId
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Affichage des menus */}
              {menuItems.map((menuItem) => {
                return (
                  <Card key={`menu-${menuItem.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-3xl">
                            {menuItem.image ? (
                              <Image
                                src={menuItem.image}
                                alt={menuItem.name}
                                width={80}
                                height={80}
                                className="rounded-lg"
                              />
                            ) : (
                              <span className="text-3xl">🍽️</span>
                            )}
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <h3 className="font-semibold text-lg">
                              {menuItem.name}
                            </h3>
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              🍽️ Menu
                            </span>
                          </div>
                          
                          {menuItem.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {menuItem.description}
                            </p>
                          )}

                          {/* Détails des sélections */}
                          <div className="mt-2 space-y-1">
                            {menuItem.selections.pizzas.length > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Pizzas:</span> {menuItem.selections.pizzas.map(p => `${p.productName} (x${p.quantity})`).join(', ')}
                              </div>
                            )}
                            {menuItem.selections.drinks.length > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Boissons:</span> {menuItem.selections.drinks.map(d => `${d.productName} (x${d.quantity})`).join(', ')}
                              </div>
                            )}
                            {menuItem.selections.desserts.length > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Desserts:</span> {menuItem.selections.desserts.map(d => `${d.productName} (x${d.quantity})`).join(', ')}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateMenuQuantity(menuItem.id, menuItem.quantity - 1)}
                                disabled={menuItem.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {menuItem.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateMenuQuantity(menuItem.id, menuItem.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="font-semibold">
                                {formatPrice(menuItem.price * menuItem.quantity)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMenuItem(menuItem.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Résumé de la commande */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{`Résumé de la commande`}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode de livraison */}
                <div>
                  <p className="font-medium mb-2">{`Mode de livraison`}</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        value="delivery"
                        checked={deliveryMethod === "delivery"}
                        onChange={() => setDeliveryMethod("delivery")}
                        className="text-red-600"
                      />
                      <span>{`Livraison à domicile`}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={deliveryMethod === "pickup"}
                        onChange={() => setDeliveryMethod("pickup")}
                        className="text-red-600"
                      />
                      <span>{`Retrait sur place`}</span>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>{`Sous-total`}</span>
                    <span>{formatPrice(getSubTotal())}</span>
                  </div>
                  
                  {/* Affichage de la promotion dans le résumé */}
                  {promotionApplied && promotionDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">
                        <Gift className="h-4 w-4" />
                        {`Promotion ${promotionApplied.type === 'delivery' ? 'livraison' : 'retrait'}`}
                      </span>
                      <span>{`-${formatPrice(promotionDiscount)}`}</span>
                    </div>
                  )}
                  
                  {deliveryMethod === "delivery" && (
                    <div className="flex justify-between">
                      <span>{`Frais de livraison`}</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{`Total`}</span>
                    <span className="text-red-600">
                      {formatPrice(getTotal())}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleProceedToCheckout}
                  disabled={items.length === 0 && menuItems.length === 0}
                >
                  {`Passer la commande`}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <div className="mt-4 text-center">
              <Link href="/menu" className="text-red-600 hover:underline">
                {`Continuer vos achats`}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PaymentCanceled = () => {
  const searchParams = useSearchParams();
  const paymentCanceled = searchParams?.get("canceled") === "true";

  return (
    <>
      {paymentCanceled && (
        <div className="lg:col-span-3 mb-4">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{`Paiement Annulé`}</AlertTitle>
            <AlertDescription>
              {`Votre paiement a été annulé. Vous pouvez modifier votre panier ou
              réessayer.`}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};
