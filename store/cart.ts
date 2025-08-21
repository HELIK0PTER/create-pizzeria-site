import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, Variant, Category } from "@prisma/client";
import { useEffect } from "react";

// Type pour les items de menu dans le panier
interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  quantity: number;
  selections: {
    pizzas: { productId: string; productName: string; variantId: string; quantity: number }[];
    drinks: { productId: string; productName: string; variantId: string; quantity: number }[];
    desserts: { productId: string; productName: string; variantId: string; quantity: number }[];
  };
}

// Type spécifique pour les items du panier (différent de OrderItem de Prisma)
interface CartItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string | null;
  product: Product & { category: Category };
  variant?: Variant | null;
}

// Type pour les promotions appliquées
interface PromotionApplied {
  type: 'delivery' | 'pickup';
  description: string;
  pizzasFree: number;
  totalPizzas: number;
}

// Type pour les settings promotions
interface PromotionSettings {
  promotionsEnabled: boolean;
  deliveryPromotionEnabled: boolean;
  deliveryPromotionBuy: number;
  deliveryPromotionGet: number;
  pickupPromotionEnabled: boolean;
  pickupPromotionBuy: number;
  pickupPromotionGet: number;
  promotionDescription: string;
}

interface CartStore {
  items: CartItem[];
  menuItems: MenuItem[];
  deliveryMethod: "delivery" | "pickup";
  deliveryFee: number;
  promotionSettings: PromotionSettings | null;

  addItem: (
    product: Product & { category: Category },
    variant?: Variant,
    quantity?: number,
    notes?: string
  ) => void;
  addMenuItem: (menuItem: MenuItem) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  removeMenuItem: (menuId: string) => void;
  updateQuantity: (
    productId: string,
    variantId: string | null | undefined,
    quantity: number
  ) => void;
  updateMenuQuantity: (menuId: string, quantity: number) => void;
  updateNotes: (
    productId: string,
    variantId: string | null | undefined,
    notes: string
  ) => void;
  clearCart: () => void;
  setDeliveryMethod: (method: "delivery" | "pickup") => void;
  setPromotionSettings: (settings: PromotionSettings) => void;
  saveLastOrder: (orderData: {
    items: CartItem[];
    deliveryMethod: "delivery" | "pickup";
    total: number;
    orderDate: string;
    pizzaCount: number;
  }) => void;

  // Méthodes pour calculer les prix avec promotions
  getPizzaItems: () => CartItem[];
  getPromotionApplied: () => PromotionApplied | null;
  getSubTotal: () => number;
  getPromotionDiscount: () => number;
  getSubTotalWithPromotion: () => number;
  getTotal: () => number;
  getItemsCount: () => number;
}

// Fonction utilitaire pour vérifier si un produit est une pizza
const isPizza = (product: Product & { category: Category }): boolean => {
  return product.category.slug === "pizzas" || product.baseType !== null;
};

// Fonction pour calculer la promotion applicable
const calculatePromotion = (
  pizzaItems: CartItem[],
  deliveryMethod: "delivery" | "pickup",
  settings: PromotionSettings | null
): PromotionApplied | null => {
  if (!settings || !settings.promotionsEnabled) {
    return null;
  }

  const isDelivery = deliveryMethod === "delivery";
  const promotionEnabled = isDelivery 
    ? settings.deliveryPromotionEnabled 
    : settings.pickupPromotionEnabled;

  if (!promotionEnabled) {
    return null;
  }

  const buyCount = isDelivery 
    ? settings.deliveryPromotionBuy 
    : settings.pickupPromotionBuy;
  const getCount = isDelivery 
    ? settings.deliveryPromotionGet 
    : settings.pickupPromotionGet;

  // Calculer le nombre total de pizzas
  const totalPizzas = pizzaItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculer le nombre de pizzas gratuites
  const promotionGroups = Math.floor(totalPizzas / (buyCount + getCount));
  const pizzasFree = promotionGroups * getCount;

  if (pizzasFree > 0) {
    return {
      type: isDelivery ? 'delivery' : 'pickup',
      description: `${buyCount} achetées = ${getCount} offerte${getCount > 1 ? 's' : ''}`,
      pizzasFree,
      totalPizzas
    };
  }

  return null;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      menuItems: [],
      deliveryMethod: "delivery",
      deliveryFee: 3.5,
      promotionSettings: null,

      addItem: (product, variant, quantity = 1, notes) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) =>
              item.productId === product.id && item.variantId === variant?.id
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += quantity;
            return { items: newItems };
          }

          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                variantId: variant?.id || null,
                quantity,
                notes: notes || null,
                product,
                variant: variant || null,
              },
            ],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.productId === productId && item.variantId === variantId)
          ),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      updateNotes: (productId, variantId, notes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, notes }
              : item
          ),
        }));
      },

             clearCart: () => set({ items: [], menuItems: [] }),

       addMenuItem: (menuItem) => {
         set((state) => {
           const existingMenuIndex = state.menuItems.findIndex(
             (item) => item.id === menuItem.id
           );

           if (existingMenuIndex > -1) {
             const newMenuItems = [...state.menuItems];
             newMenuItems[existingMenuIndex].quantity += menuItem.quantity;
             return { menuItems: newMenuItems };
           }

           return {
             menuItems: [...state.menuItems, menuItem],
           };
         });
       },

       removeMenuItem: (menuId) => {
         set((state) => ({
           menuItems: state.menuItems.filter((item) => item.id !== menuId),
         }));
       },

       updateMenuQuantity: (menuId, quantity) => {
         if (quantity <= 0) {
           get().removeMenuItem(menuId);
           return;
         }

         set((state) => ({
           menuItems: state.menuItems.map((item) =>
             item.id === menuId ? { ...item, quantity } : item
           ),
         }));
       },

      setDeliveryMethod: (method) => {
        set({
          deliveryMethod: method,
          deliveryFee: method === "pickup" ? 0 : 3.5,
        });
      },

      setPromotionSettings: (settings) => {
        set({ promotionSettings: settings });
      },

      // Récupérer uniquement les pizzas
      getPizzaItems: () => {
        const { items } = get();
        return items.filter(item => isPizza(item.product));
      },

      // Calculer la promotion appliquée
      getPromotionApplied: () => {
        const { deliveryMethod, promotionSettings } = get();
        const pizzaItems = get().getPizzaItems();
        return calculatePromotion(pizzaItems, deliveryMethod, promotionSettings);
      },

             // Sous-total sans promotion
       getSubTotal: () => {
         const { items, menuItems } = get();
         const itemsTotal = items.reduce((total, item) => {
           const basePrice = item.product.price;
           const variantPrice = item.variant?.price || 0;
           return total + (basePrice + variantPrice) * item.quantity;
         }, 0);
         
         const menuItemsTotal = menuItems.reduce((total, item) => {
           return total + item.price * item.quantity;
         }, 0);
         
         return itemsTotal + menuItemsTotal;
       },

      // Calcul de la remise promotion
      getPromotionDiscount: () => {
        const promotion = get().getPromotionApplied();
        if (!promotion) return 0;

        const pizzaItems = get().getPizzaItems();
        
        // Trier les pizzas par prix croissant pour offrir les moins chères
        const sortedPizzaItems = [...pizzaItems].sort((a, b) => {
          const priceA = a.product.price + (a.variant?.price || 0);
          const priceB = b.product.price + (b.variant?.price || 0);
          return priceA - priceB;
        });

        let pizzasToDiscount = promotion.pizzasFree;
        let discount = 0;

        for (const item of sortedPizzaItems) {
          if (pizzasToDiscount <= 0) break;

          const itemPrice = item.product.price + (item.variant?.price || 0);
          const discountQuantity = Math.min(pizzasToDiscount, item.quantity);
          
          discount += itemPrice * discountQuantity;
          pizzasToDiscount -= discountQuantity;
        }

        return discount;
      },

      // Sous-total avec promotion appliquée
      getSubTotalWithPromotion: () => {
        return get().getSubTotal() - get().getPromotionDiscount();
      },

      // Total final
      getTotal: () => {
        const { deliveryFee } = get();
        return get().getSubTotalWithPromotion() + deliveryFee;
      },

             getItemsCount: () => {
         const { items, menuItems } = get();
         const itemsCount = items.reduce((count, item) => count + item.quantity, 0);
         const menuItemsCount = menuItems.reduce((count, item) => count + item.quantity, 0);
         return itemsCount + menuItemsCount;
       },

      saveLastOrder: (orderData) => {
        try {
          localStorage.setItem("lastOrder", JSON.stringify(orderData));
        } catch (error) {
          console.error("Erreur lors de la sauvegarde de la dernière commande:", error);
        }
      },
    }),
    {
      name: "pizza-cart",
    }
  )
);

// Hook pour charger automatiquement les settings de promotion
export const usePromotionSettings = () => {
  const setPromotionSettings = useCart(state => state.setPromotionSettings);

  useEffect(() => {
    const loadPromotionSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          setPromotionSettings({
            promotionsEnabled: settings.promotionsEnabled || false,
            deliveryPromotionEnabled: settings.deliveryPromotionEnabled || false,
            deliveryPromotionBuy: settings.deliveryPromotionBuy || 2,
            deliveryPromotionGet: settings.deliveryPromotionGet || 1,
            pickupPromotionEnabled: settings.pickupPromotionEnabled || false,
            pickupPromotionBuy: settings.pickupPromotionBuy || 1,
            pickupPromotionGet: settings.pickupPromotionGet || 1,
            promotionDescription: settings.promotionDescription || "Promotions sur les pizzas !",
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres de promotion:', error);
      }
    };

    loadPromotionSettings();
  }, [setPromotionSettings]);
};

// Fonction utilitaire pour récupérer la dernière commande depuis localStorage
export const getLastOrder = () => {
  try {
    if (typeof window !== "undefined") {
      const lastOrder = localStorage.getItem("lastOrder");
      if (lastOrder) {
        const parsedOrder = JSON.parse(lastOrder);
        // Vérifier si la commande a moins de 24h
        const orderDate = new Date(parsedOrder.orderDate);
        const now = new Date();
        const hoursDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
          return parsedOrder;
        } else {
          // Supprimer la commande si elle a plus de 24h
          localStorage.removeItem("lastOrder");
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de la dernière commande:", error);
    return null;
  }
};
