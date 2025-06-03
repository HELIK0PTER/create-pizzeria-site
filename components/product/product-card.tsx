"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Info, Star, Clock } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product, Category, Variant } from "@prisma/client";
import BaseBadge from "./base-badge";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const extendedProduct = product as Product & {
    category?: Category;
    variants?: Variant[];
  };

  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(
    extendedProduct.variants?.find((v) => v.isDefault) ||
      extendedProduct.variants?.[0]
  );
  const [isAdding, setIsAdding] = useState(false);

  const price = extendedProduct.price + (selectedVariant?.price || 0);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(extendedProduct, selectedVariant);
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <Card className="h-full w-full flex flex-col flex-1 justify-between group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 py-0">
      {/* Image Header */}
      <CardHeader className="p-0 relative">
        <div className="relative aspect-square bg-gradient-to-br from-orange-50 to-red-50 overflow-hidden">
          {extendedProduct.image ? (
            <Image
              src={extendedProduct.image}
              alt={extendedProduct.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl opacity-60">🍕</span>
            </div>
          )}

          {/* Badges et status */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {extendedProduct.category && (
              <Badge
                variant="secondary"
                className="bg-white/90 text-gray-700 backdrop-blur-sm"
              >
                {extendedProduct.category.name}
              </Badge>
            )}
            {!extendedProduct.isAvailable && (
              <Badge
                variant="destructive"
                className="bg-red-500/90 text-white backdrop-blur-sm"
              >
                Indisponible
              </Badge>
            )}
          </div>

          {/* Note */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs font-medium text-gray-600">4.8</span>
            </div>
          </div>

          {!extendedProduct.isAvailable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-semibold text-lg">
                Temporairement indisponible
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Contenu */}
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Titre et prix */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xl text-gray-900 leading-tight">
              {extendedProduct.name}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-orange-600">
                {formatPrice(price)}
              </span>
              {(extendedProduct.ingredients || extendedProduct.allergens) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-orange-600"
                >
                  <Info className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Base */}
          {extendedProduct.baseType && (
            <BaseBadge baseType={extendedProduct.baseType} />
          )}

          {/* Ingrédients */}
          {extendedProduct.ingredients && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Ingrédients :</h4>
              <div className="flex flex-wrap gap-2">
                {extendedProduct.ingredients.split(',').map((ingredient, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="bg-orange-50 text-orange-700 border border-orange-200"
                  >
                    {ingredient.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {extendedProduct.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Description :</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {extendedProduct.description}
              </p>
            </div>
          )}

          {/* Variants/Tailles */}
          {extendedProduct.variants && extendedProduct.variants.length > 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900">
                Choisir la taille :
              </p>
              <div className="grid grid-cols-3 gap-2">
                {extendedProduct.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`
                      relative px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all duration-200
                      ${
                        selectedVariant?.id === variant.id
                          ? "bg-orange-600 text-white border-orange-600 shadow-md"
                          : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{variant.name}</div>
                      {variant.price > 0 ? (
                        <div className="text-xs opacity-75">
                          {formatPrice(extendedProduct.price + variant.price)}
                        </div>
                      ) : (
                        <div className="text-xs opacity-75">
                          {formatPrice(extendedProduct.price)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer avec bouton */}
      <CardFooter className="p-6 pt-0">
        <motion.div
          className="w-full"
          animate={isAdding ? { scale: [1, 0.95, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={handleAddToCart}
            disabled={!extendedProduct.isAvailable || isAdding}
            size="lg"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            {isAdding ? "Ajouté !" : extendedProduct.isAvailable ? "Ajouter au panier" : "Indisponible"}
          </Button>
        </motion.div>
      </CardFooter>
    </Card>
  );
}
