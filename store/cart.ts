import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product, Variant } from "@/types";

interface CartStore {
  items: CartItem[];
  deliveryMethod: "delivery" | "pickup";
  deliveryFee: number;

  addItem: (
    product: Product,
    variant?: Variant,
    quantity?: number,
    notes?: string
  ) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (
    productId: string,
    variantId: string | undefined,
    quantity: number
  ) => void;
  updateNotes: (
    productId: string,
    variantId: string | undefined,
    notes: string
  ) => void;
  clearCart: () => void;
  setDeliveryMethod: (method: "delivery" | "pickup") => void;

  getSubTotal: () => number;
  getTotal: () => number;
  getItemsCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryMethod: "delivery",
      deliveryFee: 3.5,

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
                variantId: variant?.id,
                quantity,
                notes,
                product,
                variant,
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

      clearCart: () => set({ items: [] }),

      setDeliveryMethod: (method) => {
        set({
          deliveryMethod: method,
          deliveryFee: method === "pickup" ? 0 : 3.5,
        });
      },

      getSubTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const basePrice = item.product.price;
          const variantPrice = item.variant?.price || 0;
          return total + (basePrice + variantPrice) * item.quantity;
        }, 0);
      },

      getTotal: () => {
        const { deliveryFee } = get();
        return get().getSubTotal() + deliveryFee;
      },

      getItemsCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "pizza-cart",
    }
  )
);
