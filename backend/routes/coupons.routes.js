import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { validateCoupon } from '../controllers/coupons.controller.js';

const router = Router();
router.post('/validate', [body('code').trim().isLength({min:3,max:40}), body('items').isArray({min:1,max:50})], validate, validateCoupon);
export default router;
