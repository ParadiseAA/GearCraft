import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../config/mail";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByPasswordResetCode,
  savePasswordResetCode,
  updatePasswordAndClearResetCode,
  updateUserPassword,
  updateUserProfile,
} from "../models/User";
import { AuthenticatedRequest } from "../middleware/auth";

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

const generatePasswordResetCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const publicResetMessage = "Якщо цей email існує, код відновлення надіслано";

const serializeUser = (user: {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
}) => ({
  id: user.id,
  name: user.name,
  surname: user.surname,
  email: user.email,
  role: user.role,
  isAdmin: user.role === "admin",
});

export const register = async (req: Request, res: Response) => {
  const name = String(req.body.name ?? "").trim();
  const surname = String(req.body.surname ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  if (name.length < 2 || name.length > 80) {
    return res
      .status(400)
      .json({ message: "Ім'я має містити від 2 до 80 символів" });
  }

  if (surname.length < 2 || surname.length > 80) {
    return res
      .status(400)
      .json({ message: "Прізвище має містити від 2 до 80 символів" });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Введіть коректний email" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Пароль має містити щонайменше 6 символів" });
  }

  const exists = await findUserByEmail(email);
  if (exists) {
    return res
      .status(400)
      .json({ message: "Користувач з таким email вже існує" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser({
    name,
    surname,
    email,
    password: hashed,
    role: "user",
  });
  const token = generateToken(user.id, user.role);

  res.status(201).json({
    token,
    user: serializeUser(user),
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(400).json({ message: "Невірний email або пароль" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ message: "Невірний email або пароль" });
  }

  const token = generateToken(user.id, user.role);

  res.json({
    token,
    user: serializeUser(user),
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Потрібна авторизація" });
  }

  const user = await findUserById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "Користувача не знайдено" });
  }

  res.json(serializeUser(user));
};

export const updateMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Потрібна авторизація" });
  }

  const name = String(req.body.name ?? "").trim();
  const surname = String(req.body.surname ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();

  if (name.length < 2 || name.length > 80) {
    return res
      .status(400)
      .json({ message: "Ім'я має містити від 2 до 80 символів" });
  }

  if (surname.length < 2 || surname.length > 80) {
    return res
      .status(400)
      .json({ message: "Прізвище має містити від 2 до 80 символів" });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Введіть коректний email" });
  }

  const existing = await findUserByEmail(email);
  if (existing && existing.id !== req.user.id) {
    return res
      .status(400)
      .json({ message: "Користувач з таким email вже існує" });
  }

  const user = await updateUserProfile({
    userId: req.user.id,
    name,
    surname,
    email,
  });

  res.json(serializeUser(user));
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Потрібна авторизація" });
  }

  const currentPassword = String(req.body.currentPassword ?? "");
  const newPassword = String(req.body.newPassword ?? "");

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Пароль має містити щонайменше 6 символів" });
  }

  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Користувача не знайдено" });
  }

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    return res
      .status(400)
      .json({ message: "Поточний пароль введено неправильно" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await updateUserPassword({ userId: user.id, password: hashed });

  res.json({ message: "Пароль успішно змінено" });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Введіть коректний email" });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return res.json({ message: publicResetMessage });
  }

  const code = generatePasswordResetCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await savePasswordResetCode({
    userId: user.id,
    code,
    expiresAt,
  });

  await sendPasswordResetEmail({
    email: user.email,
    code,
  });

  res.json({ message: publicResetMessage });
};

export const resetPassword = async (req: Request, res: Response) => {
  const code = String(req.body.code ?? "").trim();
  const password = String(req.body.password ?? "");

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Введіть коректний 6-значний код" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Пароль має містити щонайменше 6 символів" });
  }

  const user = await findUserByPasswordResetCode(code);

  if (!user?.passwordResetExpires) {
    return res.status(400).json({ message: "Код відновлення недійсний" });
  }

  if (user.passwordResetExpires.getTime() < Date.now()) {
    return res
      .status(400)
      .json({ message: "Термін дії коду відновлення минув" });
  }

  const hashed = await bcrypt.hash(password, 10);

  await updatePasswordAndClearResetCode({
    userId: user.id,
    password: hashed,
  });

  res.json({ message: "Пароль успішно змінено" });
};
