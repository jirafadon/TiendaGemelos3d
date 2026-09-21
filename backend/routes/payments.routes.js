import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect, optionalProtect, notBlocked } from '../middleware/auth.js';
import {
  checkout,
  mpWebhook
} from '../controllers/payments.controller.js';

const router = Router();

router.post('/checkout',[body('items').isArray({min:1,max:50}),body('customer').isObject(),body('customer.name').trim().isLength({min:2,max:120}),body('customer.email').isEmail(),body('customer.phone').trim().isLength({min:6,max:40}),body('customer.address').trim().isLength({min:3,max:240}),body('customer.city').trim().isLength({min:2,max:100}),body('customer.zip').trim().isLength({min:3,max:20}),body('payMethod').optional().isIn(['mercadopago','mp','transfer','bank_transfer','cash']),body('couponCode').optional({nullable:true}).trim().isLength({max:40})],validate,optionalProtect,notBlocked,checkout);
router.post('/webhook/mercadopago', mpWebhook);

export default router;
