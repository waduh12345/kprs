import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "@/types/admin/product";

// Tambahkan properti 'quantity' dan 'product_id'
export type CartItem = Product & {
  quantity: number;
  product_id: number;
};

type CartStore = {
  isOpen: boolean;
  cartItems: CartItem[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (product: Product) => void;
  removeItem: (id: number) => void;
  increaseItemQuantity: (id: number) => void;
  decreaseItemQuantity: (id: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      cartItems: [],

      open: () => set({ isOpen: true }),

      close: () => set({ isOpen: false }),

      toggle: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product) => {
        set((state) => {
          const existingItem = state.cartItems.find(
            (item) => item.product_id === product.id
          );

          if (existingItem) {
            // Jika produk sudah ada, tambah kuantitas
            return {
              cartItems: state.cartItems.map((item) =>
                item.product_id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }

          // Jika produk baru, tambahkan dengan quantity 1
          return {
            cartItems: [
              ...state.cartItems,
              {
                ...product,
                product_id: product.id, // penting!
                quantity: 1,
              },
            ],
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.product_id !== id),
        })),

      increaseItemQuantity: (id) => {
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.product_id === id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }));
      },

      decreaseItemQuantity: (id) => {
        set((state) => {
          const found = state.cartItems.find((item) => item.product_id === id);

          if (found && found.quantity > 1) {
            return {
              cartItems: state.cartItems.map((item) =>
                item.product_id === id
                  ? { ...item, quantity: item.quantity - 1 }
                  : item
              ),
            };
          }

          // quantity = 1 → hapus
          return {
            cartItems: state.cartItems.filter((item) => item.product_id !== id),
          };
        });
      },

      clearCart: () => set({ cartItems: [] }),

      getTotalItems: () => {
        const state = get();
        return state.cartItems.reduce(
          (total, item) => total + item.quantity,
          0
        );
      },

      getTotalPrice: () => {
        const state = get();
        return state.cartItems.reduce(
          (total, item) => total + (item.price ?? 0) * item.quantity,
          0
        );
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCart;