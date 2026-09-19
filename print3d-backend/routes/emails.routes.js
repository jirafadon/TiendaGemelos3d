import { Router } from 'express';
import { body } from 'express-validator';
import { subscribeNewsletter } from '../controllers/emails.controller.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post(
  '/newsletter',
  [body('email').isEmail().withMessage('Email inválido.')],
  validate,
  subscribeNewsletter
);

export default router;
