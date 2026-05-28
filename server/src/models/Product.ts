import { pool } from "../config/db";

export interface IProduct {
  id: string;
  _id: string;
  title: string;
  name: string;
  description: string;
  descriptionUk?: string;
  descriptionEn?: string;
  price: number;
  image: string;
  category: string;
  images: string[];
  stock: number;
  countInStock: number;
  sellerId:
    | string
    | {
        id: string;
        name: string;
        email: string;
      };
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const mapProduct = (row: Record<string, unknown>): IProduct => {
  const id = row.id as string;
  const sellerName = row.seller_name as string | undefined;
  const sellerEmail = row.seller_email as string | undefined;

  return {
    id,
    _id: id,
    title: row.title as string,
    name: row.title as string,
    description: row.description as string,
    descriptionUk: (row.description_uk as string | null) ?? undefined,
    descriptionEn: (row.description_en as string | null) ?? undefined,
    price: Number(row.price),
    image: ((row.images as string[]) ?? [])[0] ?? "",
    category: row.category as string,
    images: (row.images as string[]) ?? [],
    stock: Number(row.stock),
    countInStock: Number(row.stock),
    sellerId:
      sellerName && sellerEmail
        ? {
            id: row.seller_id as string,
            name: sellerName,
            email: sellerEmail,
          }
        : (row.seller_id as string),
    rating: Number(row.rating),
    reviewsCount: Number(row.reviews_count),
    isActive: row.is_active as boolean,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
};

export const createProductRecord = async (input: {
  title: string;
  description: string;
  descriptionUk?: string;
  descriptionEn?: string;
  price: number;
  category: string;
  stock: number;
  sellerId: string;
  images?: string[];
}): Promise<IProduct> => {
  const { rows } = await pool.query(
    `
      INSERT INTO products (
        title,
        description,
        description_uk,
        description_en,
        price,
        category,
        stock,
        seller_id,
        images
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [
      input.title,
      input.description,
      input.descriptionUk ?? null,
      input.descriptionEn ?? null,
      input.price,
      input.category,
      input.stock,
      input.sellerId,
      input.images ?? [],
    ],
  );

  return mapProduct(rows[0]);
};

export const findActiveProducts = async (): Promise<IProduct[]> => {
  const { rows } = await pool.query(`
    SELECT *
    FROM products
    WHERE is_active = TRUE
    ORDER BY created_at DESC
  `);

  return rows.map(mapProduct);
};

export const findAllProducts = async (): Promise<IProduct[]> => {
  const { rows } = await pool.query(`
    SELECT *
    FROM products
    ORDER BY created_at DESC
  `);

  return rows.map(mapProduct);
};

export const findProductsPage = async (
  page: number,
  limit: number,
): Promise<{ products: IProduct[]; total: number; page: number; pages: number }> => {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const [{ rows }, countResult] = await Promise.all([
    pool.query(
      `
        SELECT *
        FROM products
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [safeLimit, offset],
    ),
    pool.query("SELECT COUNT(*)::int AS total FROM products"),
  ]);

  const total = Number(countResult.rows[0]?.total ?? 0);

  return {
    products: rows.map(mapProduct),
    total,
    page: safePage,
    pages: Math.max(Math.ceil(total / safeLimit), 1),
  };
};

export const findProductById = async (
  id: string,
): Promise<IProduct | null> => {
  const { rows } = await pool.query(
    `
      SELECT
        products.*,
        users.name AS seller_name,
        users.email AS seller_email
      FROM products
      JOIN users ON users.id = products.seller_id
      WHERE products.id = $1
      LIMIT 1
    `,
    [id],
  );

  return rows[0] ? mapProduct(rows[0]) : null;
};

export const updateProductRecord = async (
  id: string,
  input: {
    title: string;
    description: string;
    descriptionUk?: string;
    descriptionEn?: string;
    price: number;
    category: string;
    stock: number;
    images: string[];
    isActive: boolean;
  },
): Promise<IProduct | null> => {
  const { rows } = await pool.query(
    `
      UPDATE products
      SET
        title = $2,
        description = $3,
        description_uk = $4,
        description_en = $5,
        price = $6,
        category = $7,
        stock = $8,
        images = $9,
        is_active = $10,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      input.title,
      input.description,
      input.descriptionUk ?? null,
      input.descriptionEn ?? null,
      input.price,
      input.category,
      input.stock,
      input.images,
      input.isActive,
    ],
  );

  return rows[0] ? mapProduct(rows[0]) : null;
};

export const deleteProductRecord = async (
  id: string,
): Promise<IProduct | null> => {
  const { rows } = await pool.query(
    `
      DELETE FROM products
      WHERE id = $1
      RETURNING *
    `,
    [id],
  );

  return rows[0] ? mapProduct(rows[0]) : null;
};
