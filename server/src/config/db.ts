import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.PGSSLMODE === "disable"
      ? false
      : {
          rejectUnauthorized: false,
        },
});

const connectDB = async (): Promise<void> => {
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        password_reset_code TEXT,
        password_reset_expires TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_reset_code TEXT
    `);
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS users_password_reset_code_idx
      ON users(password_reset_code)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL CHECK (char_length(title) <= 200),
        description TEXT NOT NULL CHECK (char_length(description) <= 5000),
        description_uk TEXT,
        description_en TEXT,
        price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
        category TEXT NOT NULL CHECK (char_length(category) <= 120),
        images TEXT[] NOT NULL DEFAULT '{}',
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating NUMERIC(3, 2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
        reviews_count INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS description_uk TEXT
    `);
    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS description_en TEXT
    `);
    await pool.query(`
      ALTER TABLE products
      DROP COLUMN IF EXISTS brand
    `);
    await pool.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_category_check
    `);
    await pool.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_category_check CHECK (char_length(category) <= 120)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_category_idx ON products(category)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_price_idx ON products(price)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_seller_id_idx ON products(seller_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_search_idx
      ON products USING GIN (to_tsvector('simple', title || ' ' || description))
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL CHECK (char_length(comment) <= 1000),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (product_id, user_id)
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, product_id)
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, product_id)
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON cart_items(user_id)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL CHECK (char_length(customer_name) <= 160),
        customer_phone TEXT NOT NULL CHECK (char_length(customer_phone) <= 40),
        customer_email TEXT CHECK (char_length(customer_email) <= 160),
        delivery_method TEXT NOT NULL CHECK (delivery_method IN ('pickup', 'nova-poshta', 'courier')),
        delivery_city TEXT NOT NULL CHECK (char_length(delivery_city) <= 120),
        delivery_address TEXT NOT NULL CHECK (char_length(delivery_address) <= 240),
        delivery_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (delivery_price >= 0),
        payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
        comment TEXT CHECK (char_length(comment) <= 1000),
        items JSONB NOT NULL,
        subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
        total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
        status TEXT NOT NULL DEFAULT 'new' CHECK (
          status IN (
            'new',
            'awaiting_payment',
            'paid',
            'processing',
            'confirmed',
            'preparing_shipment',
            'shipped',
            'pickup_point',
            'delivered',
            'completed',
            'cancelled',
            'return_requested',
            'returned'
          )
        ),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC)
    `);
    await pool.query(`
      ALTER TABLE orders
      DROP CONSTRAINT IF EXISTS orders_status_check
    `);
    await pool.query(`
      ALTER TABLE orders
      ADD CONSTRAINT orders_status_check CHECK (
        status IN (
          'new',
          'awaiting_payment',
          'paid',
          'processing',
          'confirmed',
          'preparing_shipment',
          'shipped',
          'pickup_point',
          'delivered',
          'completed',
          'cancelled',
          'return_requested',
          'returned'
        )
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)
    `);

    const { rows } = await pool.query("SELECT current_database() AS db");
    console.log(`PostgreSQL connected: ${rows[0].db}`);
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    process.exit(1);
  }
};

export { pool };
export default connectDB;
