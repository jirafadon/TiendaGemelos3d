import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
  try {
    let token = null;
    const authorization = req.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      token = authorization.slice(7).trim();
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'El usuario ya no existe.' });
    }

    req.user = user;
    req.auth = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'La sesión expiró.' : 'Token inválido.'
    });
  }
}

export async function optionalProtect(req, res, next) {
  try {
    let token = null;
    const authorization = req.headers.authorization;
    if (authorization?.startsWith('Bearer ')) token = authorization.slice(7).trim();
    if (!token && req.cookies?.token) token = req.cookies.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
      req.auth = decoded;
    }
  } catch {
    // Guest checkout: an absent/invalid token must not block the purchase.
  }
  next();
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Se requieren permisos de administrador.' });
  }
  next();
}

export function notBlocked(req, res, next) {
  if (req.user?.blocked) {
    return res.status(403).json({ success: false, message: 'Tu cuenta está bloqueada.' });
  }
  next();
}
