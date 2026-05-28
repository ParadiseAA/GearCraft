import { pool } from "../config/db";
import { IProduct, mapProduct } from "./Product";

export interface CartItem {
  product: IProduct;
  quantity: number;
}

const productSelect = `
  products.*,
  users.name AS seller_name,
  users.email AS seller_email
`;

export const findUserFavorites = async (userId: string): Promise<IProduct[]> => {
  const { rows } = await pool.query(
    `
      SELECT ${productSelect}
      FROM favorites
      JOIN products ON products.id = favorites.product_id
      JOIN users ON users.id = products.seller_id
      WHERE favorites.user_id = $1
      ORDER BY favorites.created_at DESC
    `,
    [userId],
  );

  return rows.map(mapProduct);
};

export const addUserFavorite = async (
  userId: string,
  productId: string,
): Promise<void> => {
  await pool.query(
    `
      INSERT INTO favorites (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
    `,
    [userId, productId],
  );
};

export const removeUserFavorite = async (
  userId: string,
  productId: string,
): Promise<void> => {
  await pool.query(
    `
      DELETE FROM favorites
      WHERE user_id = $1 AND product_id = $2
    `,
    [userId, productId],
  );
};

export const findUserCart = async (userId: string): Promise<CartItem[]> => {
  const { rows } = await pool.query(
    `
      SELECT
        cart_items.quantity AS cart_quantity,
        ${productSelect}
      FROM cart_items
      JOIN products ON products.id = cart_items.product_id
      JOIN users ON users.id = products.seller_id
      WHERE cart_items.user_id = $1
      ORDER BY cart_items.updated_at DESC
    `,
    [userId],
  );

  return rows.map((row) => ({
    product: mapProduct(row),
    quantity: Math.min(Number(row.cart_quantity), Number(row.stock)),
  }));
};

export const upsertUserCartItem = async (input: {
  userId: string;
  productId: string;
  quantity: number;
}): Promise<void> => {
  await pool.query(
    `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET
        quantity = EXCLUDED.quantity,
        updated_at = NOW()
    `,
    [input.userId, input.productId, input.quantity],
  );
};

export const removeUserCartItem = async (
  userId: string,
  productId: string,
): Promise<void> => {
  await pool.query(
    `
      DELETE FROM cart_items
      WHERE user_id = $1 AND product_id = $2
    `,
    [userId, productId],
  );
};

export const clearUserCart = async (userId: string): Promise<void> => {
  await pool.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
};
