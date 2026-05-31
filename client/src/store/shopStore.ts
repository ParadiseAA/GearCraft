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

const getFavoritesKey = (userId: string) => `gearrecraft:user:${userId}:favorites`;
const getCartKey = (userId: string) => `gearrecraft:user:${userId}:cart`;
const getMigrationKey = (userId: string) =>
  `gearrecraft:user:${userId}:shop-migrated`;
const guestCartKey = "gearrecraft:guest:cart";

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

const normalizeCart = (cart: CartItem[]) =>
  cart
    .map((item) => ({
      ...item,
      quantity: Math.min(Math.max(1, item.quantity), getProductStock(item.product)),
    }))
    .filter((item) => item.quantity > 0 && getProductStock(item.product) > 0);

const saveGuestCart = (cart: CartItem[]) => {
  writeStorage(guestCartKey, normalizeCart(cart));
};

const syncLegacyStorage = async (userId: string) => {
  if (localStorage.getItem(getMigrationKey(userId))) return;

  const legacyFavorites = readStorage<Product[]>(getFavoritesKey(userId), []);
  const legacyCart = readStorage<CartItem[]>(getCartKey(userId), []);
  const favoriteIds = legacyFavorites.map(getProductId).filter(Boolean);
  const cartItems = getCartSyncItems(legacyCart);

  if (favoriteIds.length > 0 || cartItems.length > 0) {
    await api.post<ShopStateResponse>("/shop/sync", {
      favoriteIds,
      cartItems,
    });
  }

  localStorage.setItem(getMigrationKey(userId), "true");
};

function getCartSyncItems(cart: CartItem[]) {
  const cartQuantities = new Map<string, number>();

  for (const item of cart) {
    const productId = getProductId(item.product);
    if (!productId || item.quantity <= 0) continue;

    cartQuantities.set(
      productId,
      (cartQuantities.get(productId) ?? 0) + item.quantity,
    );
  }

  const cartItems = Array.from(cartQuantities)
    .map((item) => ({
      productId: item[0],
      quantity: item[1],
    }))
    .filter((item) => item.productId && item.quantity > 0);

  return cartItems;
}

const syncGuestCart = async () => {
  const guestCart = readStorage<CartItem[]>(guestCartKey, []);
  const cartItems = getCartSyncItems(guestCart);

  if (cartItems.length === 0) return;

  await api.post<ShopStateResponse>("/shop/sync", {
    favoriteIds: [],
    cartItems,
  });
  localStorage.removeItem(guestCartKey);
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
      set({
        activeUserId: null,
        favorites: [],
        cart: normalizeCart(readStorage<CartItem[]>(guestCartKey, [])),
        isSyncing: false,
      });
      return;
    }

    set({ activeUserId: userId, isSyncing: true });

    try {
      await syncLegacyStorage(userId);
      await syncGuestCart();
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

    if (!userId) {
      saveGuestCart(cart);
      return;
    }

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

    const previousCart = get().cart;
    const cart = previousCart.filter(
      (item) => getProductId(item.product) !== productId,
    );

    set({ cart });

    if (!userId) {
      saveGuestCart(cart);
      return;
    }

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

    if (!userId) {
      saveGuestCart(cart);
      return;
    }

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

    const previousCart = get().cart;
    set({ cart: [] });

    if (!userId) {
      localStorage.removeItem(guestCartKey);
      return;
    }

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
