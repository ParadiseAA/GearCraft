import { pool } from "../config/db";

export type UserRole = "user" | "admin";

export interface IUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const mapUser = (row: Record<string, unknown>): IUser => ({
  id: row.id as string,
  name: row.name as string,
  surname: row.surname as string,
  email: row.email as string,
  password: row.password as string,
  role: row.role as UserRole,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export const findUserByEmail = async (
  email: string,
): Promise<IUser | null> => {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = LOWER($1) LIMIT 1",
    [email],
  );

  return rows[0] ? mapUser(rows[0]) : null;
};

export const findUserById = async (id: string): Promise<IUser | null> => {
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
