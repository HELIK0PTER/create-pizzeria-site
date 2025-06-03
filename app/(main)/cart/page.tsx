"use client";

import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "@/store/cart";
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
export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    getSubTotal,
    getTotal,
    deliveryMethod,
    setDeliveryMethod,
    deliveryFee,
  } = useCart();

  const handleQuantityChange = (
    productId: string,
    variantId: string | undefined,
    delta: number
  ) => {
    const item = items.find(
      (i) => i.productId === productId && i.variantId === variantId
    );
    if (item) {
      updateQuantity(productId, variantId, item.quantity + delta);
    }
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Votre panier</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Liste des articles */}
          {items.length === 0 && (
            <div className="lg:col-span-2 space-y-4">
              <p className="text-gray-600">Votre panier est vide.</p>
              <Link href="/menu" className="text-red-600 hover:underline">
                Voir la carte ici
              </Link>
            </div>
          )}
          {items.length > 0 && (
            <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const basePrice = item.product.price;
              const variantPrice = item.variant?.price || 0;
              const totalPrice = basePrice + variantPrice;
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
                        <h3 className="font-semibold text-lg">
                          {item.product.name}
                        </h3>
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
                                removeItem(item.productId, item.variantId)
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
            </div>
          )}

          {/* Résumé de la commande */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Résumé de la commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode de livraison */}
                <div>
                  <p className="font-medium mb-2">Mode de livraison</p>
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
                      <span>Livraison à domicile</span>
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
                      <span>Retrait sur place</span>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{formatPrice(getSubTotal())}</span>
                  </div>
                  {deliveryMethod === "delivery" && (
                    <div className="flex justify-between">
                      <span>Frais de livraison</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-red-600">
                      {formatPrice(getTotal())}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" asChild>
                  <Link href="/checkout">
                    Passer la commande
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <div className="mt-4 text-center">
              <Link href="/menu" className="text-red-600 hover:underline">
                Continuer vos achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
