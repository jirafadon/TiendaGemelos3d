import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary.js';
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
const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'tiendagemelos3d/products',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 }
});
router.use(protect, adminOnly);

router.get('/bootstrap', getBootstrap);
router.get('/dashboard', getDashboard);
router.get('/dashboard/sales-chart', getSalesChart);
router.get('/dashboard/top-products', getTopProducts);
router.get('/dashboard/recent-orders', getRecentOrders);
router.get('/dashboard/recent-users', getRecentUsers);

router.post('/upload-multiple', upload.array('images', 6), (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen válida.' });
  res.json({ success: true, urls: files.map((file) => file.path).filter(Boolean).slice(0, 6) });
});

router.post('/upload', upload.array('images', 6), (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen válida.' });
  res.json({
    success: true,
    urls: files.map((file) => file.path).filter(Boolean).slice(0, 6)
  });
});

router.get('/products', listProducts);
router.post('/products',[
  body('name').trim().isLength({min:2,max:160}),
  body('category').trim().isLength({min:2,max:60}),
  body('description').optional({ checkFalsy: true }).isString().isLength({max:5000}),
  body('price').isFloat({min:0}),
  body('stock').optional().isInt({min:0}),
  body('images').optional().isArray({max:6}),
  body('image').optional({ checkFalsy: true }).isURL({protocols:['http','https'],require_protocol:true})
],validate,createAdminProduct);
router.put('/products/:id',[
  param('id').isMongoId(),
  body('name').trim().isLength({min:2,max:160}),
  body('category').trim().isLength({min:2,max:60}),
  body('description').optional({ checkFalsy: true }).isString().isLength({max:5000}),
  body('price').isFloat({min:0}),
  body('stock').optional().isInt({min:0}),
  body('images').optional().isArray({max:6}),
  body('image').optional({ checkFalsy: true }).isURL({protocols:['http','https'],require_protocol:true})
],validate,updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);
router.patch('/products/:id/toggle', toggleAdminProduct);

router.get('/orders', listOrders);
router.get('/orders/export', exportOrders);
router.get('/orders/:id', getAdminOrder);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/resend-email',[param('id').isMongoId()],validate,resendOrderEmail);

router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/coupons', listCoupons);
router.post('/coupons',[body('code').trim().isLength({min:3,max:40}),body('type').isIn(['percent','fixed','shipping']),body('value').isFloat({min:0}),body('maxUses').optional({nullable:true}).isInt({min:0})],validate,createCoupon);
router.put('/coupons/:id',[param('id').isMongoId(),body('code').optional().trim().isLength({min:3,max:40}),body('type').optional().isIn(['percent','fixed','shipping']),body('value').optional().isFloat({min:0})],validate,updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/settings', getSettings);
router.put('/settings',[body('storeName').optional().trim().isLength({max:120}),body('storeEmail').optional().isEmail(),body('shippingCost').optional().isFloat({min:0}),body('freeShippingMin').optional().isFloat({min:0})],validate,updateSettings);

export default router;
