import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type UserRole = "user" | "admin";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

export const protect = (
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
      role: UserRole;
    };

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ message: "Сесія недійсна, увійдіть знову" });
  }
};

export const optionalAuth = (
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
      role: UserRole;
    };

    req.user = { id: decoded.id, role: decoded.role };
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
