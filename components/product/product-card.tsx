"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, Info, Star, Heart } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface ProductCardProps {
  product: Product;
  isCompact?: boolean;
}

export function ProductCard({ product, isCompact }: ProductCardProps) {
  const extendedProduct = product as Product & {
    category?: Category;
    variants?: Variant[];
  };

  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(
    extendedProduct.variants?.find((v) => v.isDefault) ||
      extendedProduct.variants?.[0]
  );
  const [clickCount, setClickCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [selectedVariantInDialog, setSelectedVariantInDialog] = useState<
    Variant | undefined
  >(undefined);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [selectedVariantInInfoDialog, setSelectedVariantInInfoDialog] =
    useState<Variant | undefined>(undefined);

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!userId || !extendedProduct.id) return;
      setIsLoadingFavorite(true);
      try {
        const response = await fetch(
          `/api/favorites?productId=${extendedProduct.id}&userId=${userId}`
        );
        const data = await response.json();
        setIsFavorite(data.isFavorite);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du statut favori:",
          error
        );
      } finally {
        setIsLoadingFavorite(false);
      }
    };
    checkFavoriteStatus();
  }, [userId, extendedProduct.id]);

  const handleToggleFavorite = async () => {
    if (!userId) {
      console.warn(
        "Utilisateur non connecté. Impossible de marquer le produit comme favori."
      );
      // TODO: Afficher une notification ou rediriger vers la page de connexion
      return;
    }

    setIsLoadingFavorite(true);
    try {
      const method = isFavorite ? "DELETE" : "POST";
      const response = await fetch("/api/favorites", {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: extendedProduct.id, userId }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite); // Bascule l'état en cas de succès
      } else {
        console.error(
          "Échec de l'activation/désactivation du statut favori:",
          response.statusText
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'activation/désactivation du statut favori:",
        error
      );
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const price = extendedProduct.price + (selectedVariant?.price || 0);

  const handleAddToCart = () => {
    // Vérifier que le produit a une catégorie avant d'ajouter au panier
    if (!extendedProduct.category) {
      console.error("Le produit n'a pas de catégorie associée");
      return;
    }

    // Ajouter l'item au panier avec le type correct
    const productWithCategory = {
      ...extendedProduct,
      category: extendedProduct.category,
    } as Product & { category: Category };

    addItem(productWithCategory, selectedVariant);

    // Augmenter le compteur
    setClickCount((prev) => prev + 1);
    setShowPopup(true);

    // Clear le timeout précédent s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programmer le reset après 2000ms
    timeoutRef.current = setTimeout(() => {
      setShowPopup(false);
      // Reset le compteur après la fin de l'animation de fade out
      setTimeout(() => setClickCount(0), 300);
    }, 2000);
  };

  const handleAddVariantToCart = (variant: Variant) => {
    if (!extendedProduct.category) {
      console.error("Le produit n'a pas de catégorie associée");
      return;
    }
    const productWithCategory = {
      ...extendedProduct,
      category: extendedProduct.category,
    } as Product & { category: Category };
    addItem(productWithCategory, variant);
    setShowVariantDialog(false); // Fermer la modale après l'ajout
    setClickCount((prev) => prev + 1);
    setShowPopup(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowPopup(false);
      setTimeout(() => setClickCount(0), 300);
    }, 2000);
  };

  // Gérer l'ouverture de la modale pour initialiser selectedVariantInDialog
  useEffect(() => {
    if (showVariantDialog) {
      setSelectedVariantInDialog(selectedVariant);
    }
  }, [showVariantDialog, selectedVariant]);

  // Gérer l'ouverture de la modale d'infos pour initialiser selectedVariantInInfoDialog
  useEffect(() => {
    if (showInfoDialog) {
      setSelectedVariantInInfoDialog(selectedVariant);
    }
  }, [showInfoDialog, selectedVariant]);

  // Fonction pour valider le choix de variante dans la modale
  const handleConfirmVariantSelection = () => {
    if (selectedVariantInDialog) {
      handleAddVariantToCart(selectedVariantInDialog);
    }
  };

  // Fonction pour ajouter au panier depuis le dialog d'informations
  const handleAddFromInfoDialog = () => {
    if (!extendedProduct.category) {
      console.error("Le produit n'a pas de catégorie associée");
      return;
    }
    const productWithCategory = {
      ...extendedProduct,
      category: extendedProduct.category,
    } as Product & { category: Category };

    // Utiliser la variante sélectionnée dans le dialog d'info ou la variante par défaut
    const variantToAdd = selectedVariantInInfoDialog || selectedVariant;
    addItem(productWithCategory, variantToAdd);

    setShowInfoDialog(false); // Fermer la modale après l'ajout
    setClickCount((prev) => prev + 1);
    setShowPopup(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowPopup(false);
      setTimeout(() => setClickCount(0), 300);
    }, 2000);
  };

  // Cleanup du timeout au démontage du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Card
      className={`h-full w-full sm:w-full flex gap-0 ${isCompact ? "flex-row items-stretch p-0" : "flex-col flex-1 justify-between"} group overflow-hidden border-0 shadow-md ${isCompact ? "hover:shadow-md" : "hover:shadow-xl hover:-translate-y-1"} transition-all duration-300 py-0`}
    >
      {/* Image Header */}
      <CardHeader
        className={`relative p-0 ${isCompact ? "flex aspect-square h-32 flex-shrink-0 gap-0" : ""}`}
      >
        <div
          className={`relative ${isCompact ? "w-full h-full" : "aspect-square"} bg-gradient-to-br from-orange-50 to-red-50 overflow-hidden `}
        >
          {extendedProduct.image ? (
            <Image
              src={extendedProduct.image}
              alt={extendedProduct.name}
              priority
              fill
              sizes="500px"
              className={`object-cover transition-transform duration-300 group-hover:scale-105 ${!extendedProduct.isAvailable ? "filter blur-[2px]" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl opacity-60">🍕</span>
            </div>
          )}

          {!extendedProduct.isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span
                className={`bg-orange-500 text-white px-4 py-2 rounded-md ${isCompact ? "text-xs" : "text-3xl"} font-extrabold uppercase tracking-wider`}
              >
                Indisponible
              </span>
            </div>
          )}

          {/* Badges et status (cachés en vue compacte) */}
          <div
            className={`absolute top-4 left-4 flex-col gap-2 ${isCompact ? "hidden" : "flex"}`}
          >
            {extendedProduct.category && (
              <Badge
                variant="secondary"
                className="bg-white/90 text-gray-700 backdrop-blur-sm"
              >
                {extendedProduct.category.name}
              </Badge>
            )}
          </div>

          {/* Note et Favoris (cachés en vue compacte) */}
          <div
            className={`absolute bottom-4 right-4 flex gap-2 ${isCompact ? "hidden" : ""}`}
          >
            {/* Note */}
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs font-medium text-gray-600">4.8</span>
            </div>
            {/* Bouton Favori */}
            {session && ( // Afficher uniquement si l'utilisateur est connecté
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className={`
                  p-1 h-7 w-7 rounded-full transition-all duration-200
                  ${isFavorite ? "bg-red-500/90 text-white hover:bg-red-600" : "bg-white/90 text-gray-500 hover:bg-gray-200"}
                  ${isLoadingFavorite ? "cursor-not-allowed opacity-60" : ""}
                `}
                disabled={isLoadingFavorite}
              >
                <Heart
                  className={`h-3 w-3 ${isFavorite ? "fill-current" : ""}`}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Contenu */}
      <CardContent
        className={`flex flex-col flex-grow ${isCompact ? "p-1" : "p-4"}`}
      >
        {isCompact ? (
          // Vue compacte: nom, prix, ingrédients, base, et boutons sur une ligne
          <div className="flex flex-row items-stretch flex-grow">
            {/* Informations textuelles (nom, prix, ingrédients, base) */}
            <div className="flex flex-col flex-grow min-w-0 pr-2">
              <div className="flex flex-row items-center justify-between">
                <h3 className="font-semibold text-sm leading-tight line-clamp-1 text-gray-900">
                  {extendedProduct.name}
                </h3>
                {extendedProduct.baseType && (
                  <BaseBadge
                    baseType={extendedProduct.baseType}
                    isCompact={isCompact}
                  />
                )}
              </div>
              <span className="text-xs font-semibold text-orange-600">
                {formatPrice(price)}
              </span>
              <div className="flex flex-row items-center gap-2 mt-3 ">
                <p className="text-xs font-semibold max-w-20">
                  Ingrédients, description et allergènes
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInfoDialog(true)}
                  className="h-6 w-6"
                >
                  <Info className="h-8 w-8" />
                </Button>
              </div>
            </div>

            {/* Boutons (Favori et Ajouter au panier) */}
            <div className="grid grid-rows-3 justify-between items-end pl-2">
              {session && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className={`
                    h-8 w-8 rounded-full transition-all duration-200
                    ${isFavorite ? "bg-red-500/90 text-white hover:bg-red-600" : "bg-white/90 text-gray-500 hover:bg-gray-200"}
                    ${isLoadingFavorite ? "cursor-not-allowed opacity-60" : ""}
                  `}
                  disabled={isLoadingFavorite}
                >
                  <Heart
                    className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                  />
                </Button>
              )}
              <Button
                onClick={() => {
                  if (
                    extendedProduct.variants &&
                    extendedProduct.variants.length > 1
                  ) {
                    setShowVariantDialog(true);
                  } else {
                    handleAddToCart(); // Appel direct si pas de variantes
                  }
                }}
                disabled={!extendedProduct.isAvailable}
                size="icon"
                className="row-start-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          // Vue standard: contenu original
          <>
            {/* Titre et prix */}
            <div className="space-y-2 flex justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`font-semibold text-xl text-gray-900 leading-tight`}
                  >
                    {extendedProduct.name}
                  </h3>
                </div>
                <span className={`text-2xl font-bold text-orange-600`}>
                  {formatPrice(price)}
                </span>
              </div>
              <div>
                {/* Base */}
                {extendedProduct.baseType && (
                  <BaseBadge baseType={extendedProduct.baseType} />
                )}
              </div>
            </div>

            {/* Ingrédients, description et allergènes au clic du bouton infos */}
            <div className="flex flex-row items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {`Ingrédients, description et allergènes`}
              </span>
              {(extendedProduct.ingredients ||
                extendedProduct.description ||
                extendedProduct.allergens) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfoDialog(true)}
                  className="text-gray-500 hover:text-orange-600"
                >
                  <Info className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* Footer original (caché en vue compacte) */}
        <CardFooter
          className={`w-full relative ${isCompact ? "hidden" : "pt-6 px-0 mt-auto flex flex-col"}`}
        >
          {/* Variants/Tailles */}
          {extendedProduct.variants && extendedProduct.variants.length > 0 && (
            <div
              className={`space-y-3 ${isCompact ? "hidden" : "mb-4 w-full"}`}
            >
              <p className="text-sm font-medium underline text-gray-900">
                {extendedProduct.variants.length > 1
                  ? `Choisir la taille :`
                  : `Taille :`}
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
                      <div className={`font-semibold`}>{variant.name}</div>
                      {variant.price > 0 ? (
                        <div className={`text-xs opacity-75`}>
                          {formatPrice(extendedProduct.price + variant.price)}
                        </div>
                      ) : (
                        <div className={`text-xs opacity-75`}>
                          {formatPrice(extendedProduct.price)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="w-full relative">
            {/* Ce bouton est pour la vue non compacte, il doit gérer la sélection de variantes aussi */}
            <Button
              onClick={() => {
                handleAddToCart();
              }}
              disabled={!extendedProduct.isAvailable}
              size="lg"
              className={`w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${isCompact ? "text-sm h-9" : ""}`}
            >
              <Plus className={`h-5 w-5 mr-2 ${isCompact ? "h-4 w-4" : ""}`} />
              {extendedProduct.isAvailable
                ? "Ajouter au panier"
                : "Indisponible"}
            </Button>

            {/* Popup de compteur */}
            <AnimatePresence>
              {showPopup && clickCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute -top-11 right-0 bg-green-500 text-white text-sm text-center font-bold w-12 px-2 py-2 rounded-lg shadow-lg z-10"
                >
                  <div className="relative">
                    +{clickCount}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-500 transform rotate-45"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardFooter>
      </CardContent>

      {/* Modale de sélection de variantes */}
      <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {`Choisir une taille pour ${extendedProduct.name}`}
            </DialogTitle>
            <DialogDescription>
              {`Sélectionnez la taille de votre pizza avant de l'ajouter au panier.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {extendedProduct.variants?.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariantInDialog(variant)}
                className={`
                  relative px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200
                  ${
                    selectedVariantInDialog?.id === variant.id
                      ? "bg-orange-600 text-white border-orange-600 shadow-md"
                      : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                  }
                `}
              >
                <div className="text-center">
                  <div className="font-semibold text-sm">{variant.name}</div>
                  {variant.price > 0 ? (
                    <div className="text-xs opacity-85">
                      {formatPrice(extendedProduct.price + variant.price)}
                    </div>
                  ) : (
                    <div className="text-xs opacity-85">
                      {formatPrice(extendedProduct.price)}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={handleConfirmVariantSelection}
              disabled={!selectedVariantInDialog}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Ajouter au panier
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale d'informations détaillées */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {`Informations détaillées - ${extendedProduct.name}`}
            </DialogTitle>
            <DialogDescription>
              {`Découvrez les ingrédients, la description et les allergènes de ce produit.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Ingrédients */}
            {extendedProduct.ingredients && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>🥗</span>
                  {`Ingrédients`}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {extendedProduct.ingredients
                    .split(",")
                    .map((ingredient, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1"
                      >
                        {ingredient.trim()}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {extendedProduct.description && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>📝</span>
                {`Description`}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                {extendedProduct.description}
              </p>
            </div>
          )}

          {/* Allergènes */}
          {extendedProduct.allergens && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>⚠️</span>
                {`Allergènes`}
              </h4>
              <div className="flex flex-wrap gap-2">
                {extendedProduct.allergens.split(",").map((allergen, index) => (
                  <Badge
                    key={index}
                    variant="destructive"
                    className="bg-red-50 text-red-700 border border-red-200 px-3 py-1"
                  >
                    {allergen.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Message si aucune information disponible */}
          {!extendedProduct.ingredients &&
            !extendedProduct.description &&
            !extendedProduct.allergens && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {`Aucune information détaillée disponible pour ce produit.`}
                </p>
              </div>
            )}

          {/* Sélection de variantes si disponibles */}
          {extendedProduct.variants && extendedProduct.variants.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>📏</span>
                {extendedProduct.variants.length > 1
                  ? `Choisir la taille :`
                  : `Taille :`}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {extendedProduct.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantInInfoDialog(variant)}
                    className={`
                        relative px-2 py-1 text-sm font-medium rounded-lg border-2 transition-all duration-200
                        ${
                          selectedVariantInInfoDialog?.id === variant.id
                            ? "bg-orange-600 text-white border-orange-600 shadow-md"
                            : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                        }
                      `}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{variant.name}</div>
                      {variant.price > 0 ? (
                        <div className="text-xs opacity-85">
                          {formatPrice(extendedProduct.price + variant.price)}
                        </div>
                      ) : (
                        <div className="text-xs opacity-85">
                          {formatPrice(extendedProduct.price)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-4 border-t sm:justify-between flex-col sm:flex-row pl-0">
            {/* Prix final */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-semibold text-gray-900">
                {`Prix :`}
              </span>
              <span className="text-2xl font-bold text-orange-600">
                {formatPrice(
                  extendedProduct.price +
                    (selectedVariantInInfoDialog?.price || 0)
                )}
              </span>
            </div>
            <div className="flex gap-2 flex-col-reverse sm:flex-row">
              <DialogClose asChild>
                <Button variant="outline">Fermer</Button>
              </DialogClose>
              {extendedProduct.isAvailable && (
                <Button
                  onClick={handleAddFromInfoDialog}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {`Ajouter au panier`}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
