import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { signToken, cookieOptions } from '../utils/jwt.js';
import { sendWelcome, sendPasswordReset } from '../services/email.service.js';

function sanitizeUser(user) {
  const source = user.toObject ? user.toObject() : user;
  const { password, resetToken, resetTokenExpires, ...safeUser } = source;
  return safeUser;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Falta el token de Google.' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ success: false, message: 'Google Login no está configurado.' });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(400).json({ success: false, message: 'Google no pudo verificar el email.' });
    }

    let user = await User.findOne({
      $or: [
        { googleId: payload.sub },
        { email: payload.email.toLowerCase() }
      ]
    });

    if (user?.blocked) {
      return res.status(403).json({ success: false, message: 'Tu cuenta está bloqueada.' });
    }

    let created = false;

    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email.toLowerCase(),
        avatar: payload.picture || '',
        provider: 'google',
        googleId: payload.sub,
        role: 'user',
        lastLogin: new Date()
      });
      created = true;
    } else {
      user.provider = 'google';
      user.googleId = payload.sub;
      user.avatar = payload.picture || user.avatar;
      user.lastLogin = new Date();
      await user.save();
    }

    if (created) {
      await sendWelcome(user);
    }

    const token = signToken(user);
    res.cookie('token', token, cookieOptions());

    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password, avatar = '' } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'El nombre debe tener al menos 2 caracteres.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Ingresá un email válido.' });
    }

    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(409).json({ success: false, message: 'Ya existe una cuenta con ese email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatar,
      provider: 'local',
      role: 'user',
      lastLogin: new Date()
    });

    await sendWelcome(user);

    const token = signToken(user);
    res.cookie('token', token, cookieOptions());

    res.status(201).json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email) || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }

    if (user.blocked) {
      return res.status(403).json({ success: false, message: 'Tu cuenta está bloqueada.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);
    res.cookie('token', token, cookieOptions());

    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json({ success: true, user: sanitizeUser(req.user) });
}

export function logout(req, res) {
  res.clearCookie('token', { ...cookieOptions(), maxAge: undefined });
  res.json({ success: true, message: 'Sesión cerrada correctamente.' });
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Ingresá un email válido.' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+resetToken +resetTokenExpires');

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.resetToken = hashedToken;
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      await sendPasswordReset(user, rawToken);
    }

    res.json({
      success: true,
      message: 'Si existe una cuenta con ese email, recibirás instrucciones para restablecer la contraseña.'
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password || String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Token y contraseña válida son obligatorios.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpires: { $gt: new Date() }
    }).select('+password +resetToken +resetTokenExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'El token no es válido o expiró.' });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    const jwtToken = signToken(user);
    res.cookie('token', jwtToken, cookieOptions());

    res.json({ success: true, token: jwtToken, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}
