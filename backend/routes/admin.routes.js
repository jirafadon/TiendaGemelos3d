import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import multer from 'multer';
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
  resetUserPassword,
  sendUserResetEmail,
  getUserDetail,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getSettings,
  updateSettings
} from '../controllers/admin.controller.js';
import {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  reorderAdminCategories
} from '../controllers/categories.controller.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 6
  },
  fileFilter: (req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return callback(new Error('Formato de imagen no permitido. Usá JPG, PNG, WEBP o GIF.'));
    }
    callback(null, true);
  }
});

const uploadImages = (req, res, next) => {
  upload.array('images', 6)(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Cada imagen debe pesar menos de 8 MB.'
        : error.code === 'LIMIT_FILE_COUNT'
          ? 'Podés subir hasta 6 imágenes.'
          : error.message;

      return res.status(400).json({
        success: false,
        message
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'No se pudieron procesar las imágenes.'
    });
  });
};


const uploadLogo = (req, res, next) => {
  upload.single('logo')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE' ? 'El logo debe pesar menos de 8 MB.' : error.message;
      return res.status(400).json({ success: false, message });
    }
    return res.status(400).json({ success: false, message: error.message || 'No se pudo procesar el logo.' });
  });
};

const uploadLogoToCloudinary = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: 'tiendagemelos3d/brand', resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
    (error, result) => error ? reject(error) : resolve(result)
  );
  stream.end(file.buffer);
});

const uploadToCloudinary = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'tiendagemelos3d/products',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
    },
    (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }
  );

  stream.end(file.buffer);
});

const uploadBanner = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE' ? 'La imagen debe pesar menos de 8 MB.' : error.message;
      return res.status(400).json({ success: false, message });
    }
    return res.status(400).json({ success: false, message: error.message || 'No se pudo procesar la imagen.' });
  });
};

const uploadBannerToCloudinary = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: 'tiendagemelos3d/banners', resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
    (error, result) => error ? reject(error) : resolve(result)
  );
  stream.end(file.buffer);
});

router.use(protect, adminOnly);

router.get('/bootstrap', getBootstrap);
router.get('/dashboard', getDashboard);
router.get('/dashboard/sales-chart', getSalesChart);
router.get('/dashboard/top-products', getTopProducts);
router.get('/dashboard/recent-orders', getRecentOrders);
router.get('/dashboard/recent-users', getRecentUsers);

const handleMultipleUpload = async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({
        success: false,
        message: 'Cloudinary no está configurado en el servidor.'
      });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ninguna imagen válida.'
      });
    }

    const uploads = await Promise.all(files.map(uploadToCloudinary));

    return res.json({
      success: true,
      urls: uploads.map((upload) => upload.secure_url).filter(Boolean).slice(0, 6)
    });
  } catch (error) {
    console.error('Error subiendo imágenes a Cloudinary:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al subir las imágenes a Cloudinary.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};


router.post('/upload-banner', uploadBanner, async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ success: false, message: 'Cloudinary no está configurado en el servidor.' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen.' });
    const result = await uploadBannerToCloudinary(req.file);
    return res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Error subiendo banner a Cloudinary:', error);
    return res.status(500).json({ success: false, message: 'Error al subir el banner a Cloudinary.' });
  }
});

router.post('/upload-logo', uploadLogo, async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ success: false, message: 'Cloudinary no está configurado en el servidor.' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió ningún logo.' });
    const result = await uploadLogoToCloudinary(req.file);
    return res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Error subiendo logo a Cloudinary:', error);
    return res.status(500).json({ success: false, message: 'Error al subir el logo a Cloudinary.' });
  }
});

router.post('/upload-multiple', uploadImages, handleMultipleUpload);
router.post('/upload', uploadImages, handleMultipleUpload);

router.get('/products', listProducts);
const productValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 160 }),
  body('category')
    .isString()
    .trim()
    .isLength({ min: 2, max: 60 }),
  body('description')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 5000 }),
  body('price')
    .isFloat({ min: 0 }),
  body('stock')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }),
  body('oldPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }),
  body('rating')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 5 }),
  body('reviews')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }),
  body('tags')
    .optional()
    .isArray(),
  body('images')
    .optional()
    .isArray({ max: 6 }),
  body('images.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 2048 }),
  body('image')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 2048 })
    .custom((value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }),
  body('active')
    .optional()
    .isBoolean(),
  body('variants')
    .optional()
    .isObject(),
  body('variants.color')
    .optional()
    .isArray({ max: 50 }),
  body('variants.size')
    .optional()
    .isArray({ max: 50 })
];

router.post('/products', productValidation, validate, createAdminProduct);
router.put('/products/:id', [
  param('id').isMongoId(),
  ...productValidation
], validate, updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);
router.patch('/products/:id/toggle', toggleAdminProduct);

router.get('/orders', listOrders);
router.get('/orders/export', exportOrders);
router.get('/orders/:id', getAdminOrder);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/resend-email',[param('id').isMongoId()],validate,resendOrderEmail);

router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', [param('id').isMongoId()], validate, deleteUser);
router.post('/users/:id/reset-password', [param('id').isMongoId()], validate, resetUserPassword);
router.post('/users/:id/send-reset', [param('id').isMongoId()], validate, sendUserResetEmail);
router.get('/users/:id', [param('id').isMongoId()], validate, getUserDetail);

router.get('/coupons', listCoupons);
router.post('/coupons',[body('code').trim().isLength({min:3,max:40}),body('type').isIn(['percent','fixed','shipping']),body('value').isFloat({min:0}),body('maxUses').optional({nullable:true}).isInt({min:0})],validate,createCoupon);
router.put('/coupons/:id',[param('id').isMongoId(),body('code').optional().trim().isLength({min:3,max:40}),body('type').optional().isIn(['percent','fixed','shipping']),body('value').optional().isFloat({min:0})],validate,updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/settings', getSettings);
router.get('/categories', listAdminCategories);
router.post('/categories', createAdminCategory);
router.put('/categories/:id', updateAdminCategory);
router.delete('/categories/:id', deleteAdminCategory);
router.patch('/categories/reorder', reorderAdminCategories);
router.put('/settings',[body('storeName').optional().trim().isLength({max:120}),body('storeEmail').optional({checkFalsy:true}).isEmail(),body('storeLogo').optional().isString().isLength({max:2048}),body('primaryColor').optional().matches(/^#[0-9a-fA-F]{6}$/),body('primaryColorHover').optional().matches(/^#[0-9a-fA-F]{6}$/),body('backgroundColor').optional().matches(/^#[0-9a-fA-F]{6}$/),body('textColor').optional().matches(/^#[0-9a-fA-F]{6}$/),body('headerColor').optional().matches(/^#[0-9a-fA-F]{6}$/),body('footerColor').optional().matches(/^#[0-9a-fA-F]{6}$/),body('storeWhatsApp').optional().isString().isLength({max:60}),body('storePhone').optional().isString().isLength({max:60}),body('storeAddress').optional().isString().isLength({max:240}),body('instagramUrl').optional({checkFalsy:true}).isURL(),body('facebookUrl').optional({checkFalsy:true}).isURL(),body('tiktokUrl').optional({checkFalsy:true}).isURL(),
  body('mpEnabled').optional().isBoolean(),
  body('mpPublicKey').optional().isString().isLength({max:255}),
  body('mpAccessToken').optional().isString().isLength({max:500}),
  body('mpMode').optional().isIn(['sandbox','production']),
  body('transferEnabled').optional().isBoolean(),
  body('bankHolder').optional().isString().isLength({max:160}),
  body('bankCuit').optional().isString().isLength({max:40}),
  body('bankName').optional().isString().isLength({max:160}),
  body('bankAlias').optional().isString().isLength({max:160}),
  body('bankCbu').optional().isString().isLength({max:22}),
  body('cashEnabled').optional().isBoolean(),
  body('cashInstructions').optional().isString().isLength({max:1000})],validate,updateSettings);

export default router;
