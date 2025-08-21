"use client";

import { Menu, MenuProduct, Product, Category, Variant } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pizza, Coffee, IceCream, Settings } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type MenuWithProducts = Menu & {
  menuProducts: (MenuProduct & {
    product: Product & {
      category: Category;
      variants: Variant[];
    };
  })[];
};

interface MenuCardProps {
  menu: MenuWithProducts;
  isCompact?: boolean;
}

export function MenuCard({ menu, isCompact = false }: MenuCardProps) {

  const pizzas = menu.menuProducts.filter(mp => mp.type === 'pizza');
  const drinks = menu.menuProducts.filter(mp => mp.type === 'drink');
  const desserts = menu.menuProducts.filter(mp => mp.type === 'dessert');

  // Suppression de la fonction handleAddToCart car on ne peut plus ajouter directement au panier

  return (
    <Card className={`${isCompact ? 'h-auto' : 'h-full'} hover:shadow-lg transition-shadow duration-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={`${isCompact ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-2`}>
              {menu.name}
            </CardTitle>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {formatPrice(menu.price)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {menu.menuProducts.length} produits
              </Badge>
            </div>
          </div>
          {menu.image && (
            <div className="ml-4">
              <Image
                src={menu.image}
                alt={menu.name}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Résumé des produits */}
        <div className="space-y-2 mb-4">
          {pizzas.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Pizza className="h-4 w-4 text-red-500" />
              <span>{pizzas.length} pizza{pizzas.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {drinks.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Coffee className="h-4 w-4 text-blue-500" />
              <span>{drinks.length} boisson{drinks.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {desserts.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <IceCream className="h-4 w-4 text-purple-500" />
              <span>{desserts.length} dessert{desserts.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Détails des produits (optionnel) */}
        {/* Section repliée supprimée pour simplifier la carte et éviter l'état inutile */}

        {/* Bouton d'action */}
        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            size={isCompact ? "sm" : "default"}
          >
            <Link href={`/menu/${menu.id}/select`}>
              <Settings className="h-4 w-4 mr-2" />
              Choisir ce menu
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

