import { pool } from "../config/db";

export interface IReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const mapReview = (row: Record<string, unknown>): IReview => ({
  id: row.id as string,
  productId: row.product_id as string,
  userId: row.user_id as string,
  userName: row.user_name as string,
  rating: Number(row.rating),
  comment: row.comment as string,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export const findReviewsByProductId = async (
  productId: string,
): Promise<IReview[]> => {
  const { rows } = await pool.query(
    `
      SELECT
        reviews.*,
        CONCAT(users.name, ' ', users.surname) AS user_name
      FROM reviews
      JOIN users ON users.id = reviews.user_id
      WHERE reviews.product_id = $1
      ORDER BY reviews.created_at DESC
    `,
    [productId],
  );

  return rows.map(mapReview);
};

export const upsertProductReview = async (input: {
  productId: string;
  userId: string;
  rating: number;
  comment: string;
}): Promise<{ review: IReview; productRating: number; reviewsCount: number }> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: productRows } = await client.query(
      "SELECT id FROM products WHERE id = $1 LIMIT 1",
      [input.productId],
    );

    if (!productRows[0]) {
      throw new Error("Product not found");
    }

    const { rows } = await client.query(
      `
        INSERT INTO reviews (product_id, user_id, rating, comment)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (product_id, user_id)
        DO UPDATE SET
          rating = EXCLUDED.rating,
          comment = EXCLUDED.comment,
          updated_at = NOW()
        RETURNING *
      `,
      [input.productId, input.userId, input.rating, input.comment],
    );

    const { rows: ratingRows } = await client.query(
      `
        SELECT
          COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS rating,
          COUNT(*)::int AS reviews_count
        FROM reviews
        WHERE product_id = $1
      `,
      [input.productId],
    );

    const productRating = Number(ratingRows[0]?.rating ?? 0);
    const reviewsCount = Number(ratingRows[0]?.reviews_count ?? 0);

    await client.query(
      `
        UPDATE products
        SET rating = $2, reviews_count = $3, updated_at = NOW()
        WHERE id = $1
      `,
      [input.productId, productRating, reviewsCount],
    );

    const { rows: reviewRows } = await client.query(
      `
        SELECT
          reviews.*,
          CONCAT(users.name, ' ', users.surname) AS user_name
        FROM reviews
        JOIN users ON users.id = reviews.user_id
        WHERE reviews.id = $1
        LIMIT 1
      `,
      [rows[0].id],
    );

    await client.query("COMMIT");

    return {
      review: mapReview(reviewRows[0]),
      productRating,
      reviewsCount,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteProductReview = async (input: {
  productId: string;
  reviewId: string;
}): Promise<{ productRating: number; reviewsCount: number }> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
        DELETE FROM reviews
        WHERE id = $1 AND product_id = $2
        RETURNING id
      `,
      [input.reviewId, input.productId],
    );

    if (!rows[0]) {
      throw new Error("Review not found");
    }

    const { rows: ratingRows } = await client.query(
      `
        SELECT
          COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS rating,
          COUNT(*)::int AS reviews_count
        FROM reviews
        WHERE product_id = $1
      `,
      [input.productId],
    );

    const productRating = Number(ratingRows[0]?.rating ?? 0);
    const reviewsCount = Number(ratingRows[0]?.reviews_count ?? 0);

    await client.query(
      `
        UPDATE products
        SET rating = $2, reviews_count = $3, updated_at = NOW()
        WHERE id = $1
      `,
      [input.productId, productRating, reviewsCount],
    );

    await client.query("COMMIT");

    return { productRating, reviewsCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
