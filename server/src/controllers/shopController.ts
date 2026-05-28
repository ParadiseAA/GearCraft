import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { findProductById } from "../models/Product";
import {
  addUserFavorite,
  clearUserCart,
  findUserCart,
  findUserFavorites,
  removeUserCartItem,
  removeUserFavorite,
  upsertUserCartItem,
} from "../models/ShopState";

const getUserId = (req: AuthenticatedRequest) => req.user?.id;

interface SyncCartItemInput {
  productId?: unknown;
  quantity?: unknown;
}

const getShopState = async (userId: string) => {
  const [favorites, cart] = await Promise.all([
    findUserFavorites(userId),
    findUserCart(userId),
  ]);

  return { favorites, cart };
};

export const getMyShopState = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Потрібна авторизація" });
  }

  res.json(await getShopState(userId));
};

export const toggleMyFavorite = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Потрібна авторизація" });
  }

  const productId = String(req.params.productId ?? "").trim();
  const product = await findProductById(productId);

  if (!product) {
    return res.status(404).json({ message: "Товар не знайдено" });
  }

  const favorites = await findUserFavorites(userId);
  const exists = favorites.some((favorite) => favorite.id === productId);

  if (exists) {
    await removeUserFavorite(userId, productId);
  } else {
    await addUserFavorite(userId, productId);
  }

  res.json(await getShopState(userId));
};

export const setMyCartItem = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Потрібна авторизація" });
  }

  const productId = String(req.params.productId ?? "").trim();
  const quantity = Number(req.body.quantity ?? 0);
  const product = await findProductById(productId);

  if (!product) {
    return res.status(404).json({ message: "Товар не знайдено" });
  }

  if (quantity <= 0) {
    await removeUserCartItem(userId, productId);
    return res.json(await getShopState(userId));
  }

  const safeQuantity = Math.min(Math.floor(quantity), product.stock);

  if (safeQuantity <= 0) {
    return res.status(400).json({ message: "Товару немає в наявності" });
  }

  await upsertUserCartItem({
    userId,
    productId,
    quantity: safeQuantity,
  });

  res.json(await getShopState(userId));
};

export const clearMyCart = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Потрібна авторизація" });
  }

  await clearUserCart(userId);

  res.json(await getShopState(userId));
};

export const syncMyShopState = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Потрібна авторизація" });
  }

  const favoriteIds = Array.isArray(req.body.favoriteIds)
    ? req.body.favoriteIds.map((id: unknown) => String(id)).filter(Boolean)
    : [];
  const cartItems: SyncCartItemInput[] = Array.isArray(req.body.cartItems)
    ? req.body.cartItems
    : [];

  await Promise.all(
    favoriteIds.map(async (productId: string) => {
      const product = await findProductById(productId);
      if (product) {
        await addUserFavorite(userId, productId);
      }
    }),
  );

  await Promise.all(
    cartItems.map(async (item) => {
      const productId = String(item?.productId ?? "").trim();
      const quantity = Number(item?.quantity ?? 0);
      const product = productId ? await findProductById(productId) : null;

      if (product && quantity > 0 && product.stock > 0) {
        await upsertUserCartItem({
          userId,
          productId,
          quantity: Math.min(Math.floor(quantity), product.stock),
        });
      }
    }),
  );

  res.json(await getShopState(userId));
};
