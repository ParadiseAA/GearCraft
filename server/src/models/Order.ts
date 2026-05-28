import { pool } from "../config/db";

export type DeliveryMethod = "pickup" | "nova-poshta" | "courier";
export type PaymentMethod = "cash" | "card";
export type OrderStatus =
  | "new"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "confirmed"
  | "preparing_shipment"
  | "shipped"
  | "pickup_point"
  | "delivered"
  | "completed"
  | "cancelled"
  | "return_requested"
  | "returned";

export interface OrderItem {
  productId: string;
  title: string;
  image?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IOrder {
  id: string;
  userId?: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  delivery: {
    method: DeliveryMethod;
    city: string;
    address: string;
    price: number;
  };
  payment: PaymentMethod;
  comment: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const mapOrder = (row: Record<string, unknown>): IOrder => ({
  id: row.id as string,
  userId: (row.user_id as string | null) ?? undefined,
  orderNumber: row.order_number as string,
  customer: {
    name: row.customer_name as string,
    phone: row.customer_phone as string,
    email: (row.customer_email as string | null) ?? "",
  },
  delivery: {
    method: row.delivery_method as DeliveryMethod,
    city: row.delivery_city as string,
    address: row.delivery_address as string,
    price: Number(row.delivery_price),
  },
  payment: row.payment_method as PaymentMethod,
  comment: (row.comment as string | null) ?? "",
  items: row.items as OrderItem[],
  subtotal: Number(row.subtotal),
  total: Number(row.total),
  status: row.status as OrderStatus,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export const createOrderRecord = async (input: {
  userId?: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  delivery: {
    method: DeliveryMethod;
    city: string;
    address: string;
    price: number;
  };
  payment: PaymentMethod;
  comment: string;
  items: OrderItem[];
  subtotal?: number;
  total?: number;
}): Promise<IOrder> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Вся фінансова частина формується в транзакції: блокуємо товари,
    // перевіряємо залишок, списуємо склад і рахуємо суми за цінами з бази.
    const orderItems: OrderItem[] = [];

    for (const item of input.items) {
      const { rows } = await client.query(
        `
          SELECT title, price, images, stock, is_active
          FROM products
          WHERE id = $1
          FOR UPDATE
        `,
        [item.productId],
      );

      const product = rows[0] as
        | {
            title: string;
            price: number | string;
            images: string[] | null;
            stock: number | string;
            is_active: boolean;
          }
        | undefined;

      if (!product || !product.is_active) {
        throw new Error(`Товар "${item.title}" не знайдено`);
      }

      const stock = Number(product.stock);
      const price = Number(product.price);

      if (stock < item.quantity) {
        throw new Error(
          `Недостатньо товару "${product.title}" у наявності. Доступно: ${stock}`,
        );
      }

      await client.query(
        `
          UPDATE products
          SET stock = stock - $2, updated_at = NOW()
          WHERE id = $1
        `,
        [item.productId, item.quantity],
      );

      orderItems.push({
        productId: item.productId,
        title: product.title,
        image: product.images?.[0] ?? "",
        quantity: item.quantity,
        price,
        total: price * item.quantity,
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + input.delivery.price;

    const { rows } = await client.query(
      `
        INSERT INTO orders (
          user_id,
          order_number,
          customer_name,
          customer_phone,
          customer_email,
          delivery_method,
          delivery_city,
          delivery_address,
          delivery_price,
          payment_method,
          comment,
          items,
          subtotal,
          total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `,
      [
        input.userId ?? null,
        input.orderNumber,
        input.customer.name,
        input.customer.phone,
        input.customer.email || null,
        input.delivery.method,
        input.delivery.city,
        input.delivery.address,
        input.delivery.price,
        input.payment,
        input.comment || null,
        JSON.stringify(orderItems),
        subtotal,
        total,
      ],
    );

    await client.query("COMMIT");

    return mapOrder(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const findOrdersPage = async (
  page: number,
  limit: number,
): Promise<{ orders: IOrder[]; total: number; page: number; pages: number }> => {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const [{ rows }, countResult] = await Promise.all([
    pool.query(
      `
        SELECT *
        FROM orders
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [safeLimit, offset],
    ),
    pool.query("SELECT COUNT(*)::int AS total FROM orders"),
  ]);

  const total = Number(countResult.rows[0]?.total ?? 0);

  return {
    orders: rows.map(mapOrder),
    total,
    page: safePage,
    pages: Math.max(Math.ceil(total / safeLimit), 1),
  };
};

export const findOrdersByCustomerEmail = async (
  email: string,
): Promise<IOrder[]> => {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM orders
      WHERE LOWER(customer_email) = LOWER($1)
      ORDER BY created_at DESC
    `,
    [email],
  );

  return rows.map(mapOrder);
};

// Нові замовлення шукаємо за user_id. Перевірка email лишається як fallback
// для старих або гостьових замовлень, які ще не мали user_id.
export const findOrdersByUser = async (input: {
  userId: string;
  email: string;
}): Promise<IOrder[]> => {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM orders
      WHERE user_id = $1 OR LOWER(customer_email) = LOWER($2)
      ORDER BY created_at DESC
    `,
    [input.userId, input.email],
  );

  return rows.map(mapOrder);
};

export const updateOrderStatusRecord = async (
  id: string,
  status: OrderStatus,
): Promise<IOrder | null> => {
  const { rows } = await pool.query(
    `
      UPDATE orders
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id, status],
  );

  return rows[0] ? mapOrder(rows[0]) : null;
};

export const deleteOrderRecord = async (id: string): Promise<IOrder | null> => {
  const { rows } = await pool.query(
    `
      DELETE FROM orders
      WHERE id = $1
      RETURNING *
    `,
    [id],
  );

  return rows[0] ? mapOrder(rows[0]) : null;
};
