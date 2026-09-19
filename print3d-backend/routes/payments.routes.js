import { Router } from 'express';
import { protect, notBlocked } from '../middleware/auth.js';
import {
  checkout,
  mpWebhook,
  paypalCapture,
  stripeWebhook
} from '../controllers/payments.controller.js';

const router = Router();

router.post('/checkout', protect, notBlocked, checkout);
router.post('/webhook/mercadopago', mpWebhook);
router.post('/webhook/paypal/capture', protect, notBlocked, paypalCapture);
router.post('/webhook/stripe', stripeWebhook);

export default router;
