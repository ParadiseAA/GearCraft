import { create } from "zustand";
import type { Product } from "../types/product";

interface CartItem {
  product: Product;
  quantity: number;
}

interface ShopStore {
  favorites: Product[];
  cart: CartItem[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const favoritesKey = "gearcraft:favorites";
const cartKey = "gearcraft:cart";

function getProductId(product: Product) {
  return product._id || product.id || "";
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getProductStock(product: Product) {
  return Math.max(0, product.countInStock ?? product.stock ?? 0);
}

export const useShopStore = create<ShopStore>((set, get) => ({
  favorites: readStorage<Product[]>(favoritesKey, []),
  cart: readStorage<CartItem[]>(cartKey, []),

  toggleFavorite: (product) => {
    const productId = getProductId(product);
    const exists = get().favorites.some(
      (favorite) => getProductId(favorite) === productId,
    );
    const favorites = exists
      ? get().favorites.filter((favorite) => getProductId(favorite) !== productId)
      : [product, ...get().favorites];

    writeStorage(favoritesKey, favorites);
    set({ favorites });
  },

  isFavorite: (productId) =>
    get().favorites.some((favorite) => getProductId(favorite) === productId),

  addToCart: (product) => {
    const productId = getProductId(product);
    const stock = getProductStock(product);
    if (stock <= 0) return;

    const cart = get().cart;
    const existing = cart.find((item) => getProductId(item.product) === productId);
    const nextCart = existing
      ? cart.map((item) =>
          getProductId(item.product) === productId
            ? { ...item, quantity: Math.min(item.quantity + 1, stock) }
            : item,
        )
      : [...cart, { product, quantity: 1 }];

    writeStorage(cartKey, nextCart);
    set({ cart: nextCart });
  },

  removeFromCart: (productId) => {
    const cart = get().cart.filter(
      (item) => getProductId(item.product) !== productId,
    );

    writeStorage(cartKey, cart);
    set({ cart });
  },

  updateQuantity: (productId, quantity) => {
    const cart = get().cart.map((item) =>
      getProductId(item.product) === productId
        ? {
            ...item,
            quantity: Math.min(
              Math.max(1, quantity),
              getProductStock(item.product),
            ),
          }
        : item,
    );

    writeStorage(cartKey, cart);
    set({ cart });
  },

  clearCart: () => {
    writeStorage(cartKey, []);
    set({ cart: [] });
  },
}));

export { getProductId, getProductStock };
