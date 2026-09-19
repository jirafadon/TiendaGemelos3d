import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getBootstrap,
  getDashboard,
  getSalesChart,
  getTopProducts,
  getRecentOrders,
  getRecentUsers,
  listProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  toggleAdminProduct,
  listOrders,
  getAdminOrder,
  updateOrderStatus,
  resendOrderEmail,
  exportOrders,
  listUsers,
  updateUser,
  deleteUser,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getSettings,
  updateSettings
} from '../controllers/admin.controller.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/bootstrap', getBootstrap);
router.get('/dashboard', getDashboard);
router.get('/dashboard/sales-chart', getSalesChart);
router.get('/dashboard/top-products', getTopProducts);
router.get('/dashboard/recent-orders', getRecentOrders);
router.get('/dashboard/recent-users', getRecentUsers);

router.get('/products', listProducts);
router.post('/products', createAdminProduct);
router.put('/products/:id', updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);
router.patch('/products/:id/toggle', toggleAdminProduct);

router.get('/orders', listOrders);
router.get('/orders/export', exportOrders);
router.get('/orders/:id', getAdminOrder);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/resend-email', resendOrderEmail);

router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/coupons', listCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
