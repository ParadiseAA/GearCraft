import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUserById } from "../models/User";

type UserRole = "user" | "admin";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Потрібна авторизація" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Сесія недійсна, увійдіть знову" });
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    return res.status(401).json({ message: "Сесія недійсна, увійдіть знову" });
  }
};

// Використовується там, де гість теж має доступ, але авторизованого користувача
// треба прив'язати до дії, наприклад під час створення замовлення.
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    const user = await findUserById(decoded.id);
    req.user = user ? { id: user.id, role: user.role } : undefined;
  } catch {
    req.user = undefined;
  }

  next();
};

export const authorizeRoles =
  (...allowedRoles: UserRole[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Потрібна авторизація" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Недостатньо прав доступу" });
    }

    next();
  };
