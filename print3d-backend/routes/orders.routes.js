import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getMyOrders, getOrder } from '../controllers/orders.controller.js';

const router = Router();

router.use(protect);
router.get('/', getMyOrders);
router.get('/my', getMyOrders);
router.get('/:id', getOrder);

export default router;
