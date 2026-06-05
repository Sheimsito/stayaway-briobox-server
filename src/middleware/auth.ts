import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import config from "../config/config.js";
import { userDAO } from "../dao/userDAO.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    iat?: number;
    exp?: number;
  };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token: string | undefined =
    req.cookies?.access_token ||
    (authHeader && authHeader.split(" ")[1]);
    

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token de acceso requerido"
    });
  }

  jwt.verify(token, config.jwtSecret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Token inválido o expirado"
      });
    }
    req.user = user;
    next();
  });
};

const requireEmployeeRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    console.log('[requireEmployeeRole] req.user:', req.user);
    console.log('[requireEmployeeRole] userId:', userId, typeof userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Token de acceso requerido"
      });
    }

    const user = await userDAO.findById(userId);

    if (!user || user.is_deleted) {
      return res.status(401).json({
        success: false,
        message: "Usuario no válido."
      });
    }

    if (user.role !== "empleado" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acción."
      });
    }

    next();
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor"
    });
  }
};

const rateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: config.nodeEnv === "production" ? 5 : 3,
  message: {
    success: false,
    message: "Demasiados intentos. Espera 5 minutos."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return config.nodeEnv === "development";
  }
});

export { authenticateToken, requireEmployeeRole, rateLimiter };