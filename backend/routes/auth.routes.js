import { Router } from 'express';
import { body } from 'express-validator';
import {
  googleLogin,
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/google', googleLogin);

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('El nombre es demasiado corto.'),
    body('email').isEmail().withMessage('Email inválido.'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido.'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria.')
  ],
  validate,
  login
);

router.get('/me', protect, me);
router.post('/logout', logout);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Email inválido.')],
  validate,
  forgotPassword
);

router.post(
  '/reset-password/:token',
  [body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')],
  validate,
  resetPassword
);

export default router;
