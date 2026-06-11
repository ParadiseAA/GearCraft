import { create } from "zustand";
import axios from "axios";
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

interface ShopNotice {
  id: number;
  type: "error";
  message: string;
}

interface ShopStore {
  activeUserId: string | null;
  favorites: Product[];
  cart: CartItem[];
  isSyncing: boolean;
  notice: ShopNotice | null;
  setActiveUser: (userId: string | null) => Promise<void>;
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  clearNotice: (noticeId?: number) => void;
}

const getFavoritesKey = (userId: string) => `gearrecraft:user:${userId}:favorites`;
const getCartKey = (userId: string) => `gearrecraft:user:${userId}:cart`;
const getMigrationKey = (userId: string) =>
  `gearrecraft:user:${userId}:shop-migrated`;
const guestCartKey = "gearrecraft:guest:cart";

// У різних частинах проєкту товар може мати id або _id, тому беремо доступний варіант.
function getProductId(product: Product) {
  return product._id || product.id || "";
}

// Безпечне читання localStorage: якщо дані пошкоджені, повертається запасне значення.
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

// Кількість товару береться з countInStock або stock і не може бути меншою за нуль.
function getProductStock(product: Product) {
  return Math.max(0, product.countInStock ?? product.stock ?? 0);
}

// Нормалізація кошика не дозволяє зберегти кількість більшу, ніж є на складі.
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

// Переносить старі локальні обрані товари й кошик користувача на сервер.
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
  // Однакові товари об'єднуються, щоб сервер отримав унікальні productId з підсумковою кількістю.
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
  // Якщо гість додав товари в кошик, після входу вони переносяться в акаунт.
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

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const serverMessage = error.response?.data?.message;
    if (serverMessage) {
      const suffix = /[.!?]$/.test(serverMessage) ? serverMessage : `${serverMessage}.`;
      return `${fallback} ${suffix}`;
    }
  }

  return fallback;
};

const createErrorNotice = (message: string): ShopNotice => ({
  id: Date.now(),
  type: "error",
  message,
});

// Zustand-store відповідає за обрані товари, кошик і синхронізацію цих даних із сервером.
export const useShopStore = create<ShopStore>((set, get) => ({
  activeUserId: null,
  favorites: [],
  cart: [],
  isSyncing: false,
  notice: null,

  setActiveUser: async (userId) => {
    // Якщо користувач не авторизований, працюємо тільки з гостьовим кошиком у localStorage.
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
      // Після входу синхронізуємо старі локальні дані, гостьовий кошик і актуальний стан із сервера.
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
    // Обрані товари змінюються одразу в інтерфейсі, а потім синхронізуються із сервером.
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
      .catch((error) => {
        // Якщо сервер повернув помилку, повертаємо попередній список обраних.
        if (get().activeUserId === userId) {
          const fallback = exists
            ? "Не вдалося прибрати товар з обраного. Спробуйте ще раз."
            : "Не вдалося додати товар в обране.";

          set({
            favorites: previousFavorites,
            notice: createErrorNotice(getApiErrorMessage(error, fallback)),
          });
        }
      });
  },

  isFavorite: (productId) =>
    get().favorites.some((favorite) => getProductId(favorite) === productId),

  addToCart: (product) => {
    // Додавання в кошик враховує залишок товару на складі.
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
      // Для гостя кошик зберігається локально, без запиту на сервер.
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
      .catch((error) => {
        if (get().activeUserId === userId) {
          set({
            cart: previousCart,
            notice: createErrorNotice(
              getApiErrorMessage(
                error,
                "Не вдалося додати товар у кошик.",
              ),
            ),
          });
        }
      });
  },

  removeFromCart: (productId) => {
    // Видаляємо товар із кошика локально і дублюємо зміну на сервері для авторизованого користувача.
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
      .catch((error) => {
        if (get().activeUserId === userId) {
          set({
            cart: previousCart,
            notice: createErrorNotice(
              getApiErrorMessage(
                error,
                "Не вдалося видалити товар з кошика. Спробуйте ще раз.",
              ),
            ),
          });
        }
      });
  },

  updateQuantity: (productId, quantity) => {
    // Кількість товару обмежується діапазоном від 1 до доступного залишку.
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
      .catch((error) => {
        if (get().activeUserId === userId) {
          set({
            cart: previousCart,
            notice: createErrorNotice(
              getApiErrorMessage(
                error,
                "Не вдалося оновити кількість товару. Спробуйте ще раз.",
              ),
            ),
          });
        }
      });
  },

  clearCart: () => {
    // Повне очищення кошика: для гостя чистимо localStorage, для користувача - серверний кошик.
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
      .catch((error) => {
        if (get().activeUserId === userId) {
          set({
            cart: previousCart,
            notice: createErrorNotice(
              getApiErrorMessage(
                error,
                "Не вдалося очистити кошик. Спробуйте ще раз.",
              ),
            ),
          });
        }
      });
  },

  clearNotice: (noticeId) => {
    const currentNotice = get().notice;
    if (!currentNotice || (noticeId && currentNotice.id !== noticeId)) return;

    set({ notice: null });
  },
}));

export { getProductId, getProductStock };
