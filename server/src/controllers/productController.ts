import { Request, Response } from "express";
import {
  createProductRecord,
  deleteProductRecord,
  findAllProducts,
  findActiveProducts,
  findProductById,
  findProductsPage,
  updateProductRecord,
} from "../models/Product";
import { AuthenticatedRequest } from "../middleware/auth";

// Приводить дані товару з форми до єдиного формату перед записом у базу.
const normalizeProductInput = (body: Record<string, unknown>) => {
  const title = String(body.name ?? body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const descriptionUk = String(body.descriptionUk ?? "").trim();
  const descriptionEn = String(body.descriptionEn ?? "").trim();
  const category = String(body.category ?? "").trim();
  const price = Number(body.price);
  const stock = Number(body.countInStock ?? body.stock);
  const bodyImages = Array.isArray(body.images)
    ? body.images
        .map((image) => String(image).trim())
        .filter((image) => image.length > 0)
    : [];
  const primaryImage = String(body.image ?? "").trim();
  // Видаляємо порожні та повторювані посилання на зображення.
  const images = Array.from(
    new Set([primaryImage, ...bodyImages].filter(Boolean)),
  );
  const isActive =
    typeof body.isActive === "boolean"
      ? body.isActive
      : typeof body.is_active === "boolean"
        ? body.is_active
        : true;

  if (!title || title.length > 200) {
    return { error: "Назва товару обов'язкова і має містити до 200 символів" };
  }

  if (!description || description.length > 5000) {
    return {
      error: "Опис товару обов'язковий і має містити до 5000 символів",
    };
  }

  if (!category || category.length > 120) {
    return { error: "Категорія обов'язкова і має містити до 120 символів" };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Ціна має бути додатним числом" };
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "Залишок товару має бути додатним цілим числом" };
  }

  return {
    data: {
      title,
      description,
      descriptionUk,
      descriptionEn,
      price,
      category,
      stock,
      images,
      isActive,
    },
  };
};

export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  // Створення товару доступне адміністратору; sellerId береться з авторизованого користувача.
  const normalized = normalizeProductInput(req.body);

  if ("error" in normalized) {
    return res.status(400).json({ message: normalized.error });
  }

  const product = await createProductRecord({
    title: normalized.data.title,
    description: normalized.data.description,
    descriptionUk: normalized.data.descriptionUk,
    descriptionEn: normalized.data.descriptionEn,
    price: normalized.data.price,
    category: normalized.data.category,
    stock: normalized.data.stock,
    sellerId: req.user!.id,
    images: normalized.data.images,
  });

  res.status(201).json(product);
};

export const getProducts = async (req: Request, res: Response) => {
  // Для каталогу повертаються тільки активні товари.
  const products = await findActiveProducts();
  res.json(products);
};

export const getAdminProducts = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  // Адмін-панель може отримати товари сторінками або повним списком.
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 8);

  if (req.query.page || req.query.limit) {
    const result = await findProductsPage(page, limit);
    return res.json(result);
  }

  const products = await findAllProducts();
  return res.json(products);
};

export const getProductById = async (req: Request, res: Response) => {
  // Детальна сторінка товару отримує один запис за id.
  const product = await findProductById(String(req.params.id));

  if (!product) {
    return res.status(404).json({ message: "Товар не знайдено" });
  }

  res.json(product);
};

export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  // Перед редагуванням товару дані проходять ту саму перевірку, що і при створенні.
  const normalized = normalizeProductInput(req.body);

  if ("error" in normalized) {
    return res.status(400).json({ message: normalized.error });
  }

  const product = await updateProductRecord(String(req.params.id), normalized.data);

  if (!product) {
    return res.status(404).json({ message: "Товар не знайдено" });
  }

  res.json(product);
};

export const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  // Видалення повертає видалений товар, щоб клієнт міг оновити інтерфейс.
  const product = await deleteProductRecord(String(req.params.id));

  if (!product) {
    return res.status(404).json({ message: "Товар не знайдено" });
  }

  res.json({ message: "Товар видалено", product });
};
