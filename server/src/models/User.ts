import { pool } from "../config/db";

export type UserRole = "user" | "admin";

export interface IUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  role: UserRole;
  passwordResetCode?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Перетворює назви полів із PostgreSQL у формат, який зручно використовувати в TypeScript.
const mapUser = (row: Record<string, unknown>): IUser => ({
  id: row.id as string,
  name: row.name as string,
  surname: row.surname as string,
  email: row.email as string,
  password: row.password as string,
  role: row.role as UserRole,
  passwordResetCode: (row.password_reset_code as string | null) ?? undefined,
  passwordResetExpires: (row.password_reset_expires as Date | null) ?? undefined,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export const findUserByEmail = async (
  email: string,
): Promise<IUser | null> => {
  // Email приводиться до нижнього регістру, щоб уникнути дублікатів з різним написанням.
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = LOWER($1) LIMIT 1",
    [email],
  );

  return rows[0] ? mapUser(rows[0]) : null;
};

export const findUserById = async (id: string): Promise<IUser | null> => {
  // Пошук користувача за унікальним id.
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [
    id,
  ]);

  return rows[0] ? mapUser(rows[0]) : null;
};

export const createUser = async (input: {
  name: string;
  surname: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<IUser> => {
  // Створює нового користувача і повертає повний запис із бази.
  const { rows } = await pool.query(
    `
      INSERT INTO users (name, surname, email, password, role)
      VALUES ($1, $2, LOWER($3), $4, $5)
      RETURNING *
    `,
    [input.name, input.surname, input.email, input.password, input.role ?? "user"],
  );

  return mapUser(rows[0]);
};

export const updateUserProfile = async (input: {
  userId: string;
  name: string;
  surname: string;
  email: string;
}): Promise<IUser> => {
  // Оновлює персональні дані користувача.
  const { rows } = await pool.query(
    `
      UPDATE users
      SET
        name = $2,
        surname = $3,
        email = LOWER($4),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [input.userId, input.name, input.surname, input.email],
  );

  return mapUser(rows[0]);
};

export const updateUserPassword = async (input: {
  userId: string;
  password: string;
}): Promise<void> => {
  // Записує новий hash пароля.
  await pool.query(
    `
      UPDATE users
      SET
        password = $2,
        updated_at = NOW()
      WHERE id = $1
    `,
    [input.userId, input.password],
  );
};

export const savePasswordResetCode = async (input: {
  userId: string;
  code: string;
  expiresAt: Date;
}): Promise<void> => {
  // Зберігає код і час його дії. Після expiresAt код вважається недійсним.
  await pool.query(
    `
      UPDATE users
      SET
        password_reset_code = $2,
        password_reset_expires = $3,
        updated_at = NOW()
      WHERE id = $1
    `,
    [input.userId, input.code, input.expiresAt],
  );
};

export const findUserByPasswordResetCode = async (
  code: string,
): Promise<IUser | null> => {
  // Шукає користувача за кодом відновлення пароля.
  const { rows } = await pool.query(
    `
      SELECT *
      FROM users
      WHERE password_reset_code = $1
      LIMIT 1
    `,
    [code],
  );

  return rows[0] ? mapUser(rows[0]) : null;
};

export const updatePasswordAndClearResetCode = async (input: {
  userId: string;
  password: string;
}): Promise<void> => {
  // Одним запитом змінює пароль і видаляє reset-код, щоб його не можна було використати повторно.
  await pool.query(
    `
      UPDATE users
      SET
        password = $2,
        password_reset_code = NULL,
        password_reset_expires = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
    [input.userId, input.password],
  );
};
