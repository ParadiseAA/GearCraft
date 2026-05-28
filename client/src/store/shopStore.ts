import { create } from "zustand";
import api from "../services/api";
import type { Product } from "../types/product";

interface CartItem {
  product: Product;
  quantity: number;
}

interface ShopStateResponse {
  favorites: Product[];
  cart: CartItem[];
}

interface ShopStore {
  activeUserId: string | null;
  favorites: Product[];
  cart: CartItem[];
  isSyncing: boolean;
  setActiveUser: (userId: string | null) => Promise<void>;
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const getFavoritesKey = (userId: string) => `gearcraft:user:${userId}:favorites`;
const getCartKey = (userId: string) => `gearcraft:user:${userId}:cart`;
const getMigrationKey = (userId: string) =>
  `gearcraft:user:${userId}:shop-migrated`;

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

function getProductStock(product: Product) {
  return Math.max(0, product.countInStock ?? product.stock ?? 0);
}

const normalizeCart = (cart: CartItem[]) =>
  cart
    .map((item) => ({
      ...item,
      quantity: Math.min(Math.max(1, item.quantity), getProductStock(item.product)),
    }))
    .filter((item) => item.quantity > 0 && getProductStock(item.product) > 0);

const syncLegacyStorage = async (userId: string) => {
  if (localStorage.getItem(getMigrationKey(userId))) return;

  const legacyFavorites = readStorage<Product[]>(getFavoritesKey(userId), []);
  const legacyCart = readStorage<CartItem[]>(getCartKey(userId), []);
  const favoriteIds = legacyFavorites.map(getProductId).filter(Boolean);
  const cartItems = legacyCart
    .map((item) => ({
      productId: getProductId(item.product),
      quantity: item.quantity,
    }))
    .filter((item) => item.productId && item.quantity > 0);

  if (favoriteIds.length > 0 || cartItems.length > 0) {
    await api.post<ShopStateResponse>("/shop/sync", {
      favoriteIds,
      cartItems,
    });
  }

  localStorage.setItem(getMigrationKey(userId), "true");
};

const applyServerState = (data: ShopStateResponse) => ({
  favorites: data.favorites,
  cart: normalizeCart(data.cart),
  isSyncing: false,
});

export const useShopStore = create<ShopStore>((set, get) => ({
  activeUserId: null,
  favorites: [],
  cart: [],
  isSyncing: false,

  setActiveUser: async (userId) => {
    if (!userId) {
      set({ activeUserId: null, favorites: [], cart: [], isSyncing: false });
      return;
    }

    set({ activeUserId: userId, isSyncing: true });

    try {
      await syncLegacyStorage(userId);
      const { data } = await api.get<ShopStateResponse>("/shop");
      if (get().activeUserId === userId) {
        set(applyServerState(data));
      }
    } catch {
      if (get().activeUserId === userId) {
        set({ favorites: [], cart: [], isSyncing: false });
      }
    }
  },

  toggleFavorite: (product) => {
    const userId = get().activeUserId;
    if (!userId) return;

    const productId = getProductId(product);
    const exists = get().favorites.some(
      (favorite) => getProductId(favorite) === productId,
    );
    const previousFavorites = get().favorites;
    const favorites = exists
      ? previousFavorites.filter((favorite) => getProductId(favorite) !== productId)
      : [product, ...previousFavorites];

    set({ favorites });

    void api
      .post<ShopStateResponse>(`/shop/favorites/${productId}/toggle`)
      .then(({ data }) => {
        if (get().activeUserId === userId) {
          set(applyServerState(data));
        }
      })
      .catch(() => {
        if (get().activeUserId === userId) {
          set({ favorites: previousFavorites });
        }
      });
  },

  isFavorite: (productId) =>
    get().favorites.some((favorite) => getProductId(favorite) === productId),

  addToCart: (product) => {
    const userId = get().activeUserId;
    if (!userId) return;

    const productId = getProductId(product);
    const stock = getProductStock(product);
    if (stock <= 0) return;

    const previousCart = get().cart;
    const existing = previousCart.find(
      (item) => getProductId(item.product) === productId,
    );
    const quantity = existing ? Math.min(existing.quantity + 1, stock) : 1;
    const cart = existing
      ? previousCart.map((item) =>
          getProductId(item.product) === productId
            ? { ...item, quantity }
            : item,
        )
      : [...previousCart, { product, quantity }];

    set({ cart });

    void api
      .put<ShopStateResponse>(`/shop/cart/${productId}`, { quantity })
      .then(({ data }) => {
        if (get().activeUserId === userId) {
          set(applyServerState(data));
        }
      })
      .catch(() => {
        if (get().activeUserId === userId) {
          set({ cart: previousCart });
        }
      });
  },

  removeFromCart: (productId) => {
    const userId = get().activeUserId;
    if (!userId) return;

    const previousCart = get().cart;
    const cart = previousCart.filter(
      (item) => getProductId(item.product) !== productId,
    );

    set({ cart });

    void api
      .put<ShopStateResponse>(`/shop/cart/${productId}`, { quantity: 0 })
      .then(({ data }) => {
        if (get().activeUserId === userId) {
          set(applyServerState(data));
        }
      })
      .catch(() => {
        if (get().activeUserId === userId) {
          set({ cart: previousCart });
        }
      });
  },

  updateQuantity: (productId, quantity) => {
    const userId = get().activeUserId;
    if (!userId) return;

    const previousCart = get().cart;
    const existing = previousCart.find(
      (item) => getProductId(item.product) === productId,
    );
    if (!existing) return;

    const nextQuantity = Math.min(
      Math.max(1, quantity),
      getProductStock(existing.product),
    );
    const cart = previousCart.map((item) =>
      getProductId(item.product) === productId
        ? { ...item, quantity: nextQuantity }
        : item,
    );

    set({ cart });

    void api
      .put<ShopStateResponse>(`/shop/cart/${productId}`, {
        quantity: nextQuantity,
      })
      .then(({ data }) => {
        if (get().activeUserId === userId) {
          set(applyServerState(data));
        }
      })
      .catch(() => {
        if (get().activeUserId === userId) {
          set({ cart: previousCart });
        }
      });
  },

  clearCart: () => {
    const userId = get().activeUserId;
    if (!userId) return;

    const previousCart = get().cart;
    set({ cart: [] });

    void api
      .delete<ShopStateResponse>("/shop/cart")
      .then(({ data }) => {
        if (get().activeUserId === userId) {
          set(applyServerState(data));
        }
      })
      .catch(() => {
        if (get().activeUserId === userId) {
          set({ cart: previousCart });
        }
      });
  },
}));

export { getProductId, getProductStock };
