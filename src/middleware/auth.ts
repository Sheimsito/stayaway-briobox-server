import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import config from '../config/config.js';
import { userDAO } from '../dao/userDAO.js';
import { userPermissionDAO } from '../dao/userPermissionDAO.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    iat?: number;
    exp?: number;
  };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token: string | undefined =
    req.cookies?.access_token ||
    (authHeader && authHeader.split(' ')[1]);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, config.jwtSecret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware that allows only users with the 'admin' role.
 */
const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
    }

    const user = await userDAO.findById(userId);
    if (!user || user.is_deleted) {
      return res.status(401).json({ success: false, message: 'Usuario no válido.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Solo los administradores pueden realizar esta acción.' });
    }

    next();
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
};

/**
 * Middleware factory that checks if the authenticated user has a specific permission.
 * Admins bypass this check and always have access.
 * @param permission - The permission string to validate (e.g. 'cash_register.open').
 */
const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
      }

      const user = await userDAO.findById(userId);
      if (!user || user.is_deleted) {
        return res.status(401).json({ success: false, message: 'Usuario no válido.' });
      }

      if (user.role === 'admin') {
        return next();
      }

      const hasPermission = await userPermissionDAO.hasPermission(Number(userId), permission);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `No tienes el permiso necesario para realizar esta acción: '${permission}'.`
        });
      }

      next();
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  };
};

const rateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 5 : 3,
  message: {
    success: false,
    message: 'Demasiados intentos. Espera 5 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return config.nodeEnv === 'development';
  }
});

export { authenticateToken, requireAdmin, requirePermission, rateLimiter };