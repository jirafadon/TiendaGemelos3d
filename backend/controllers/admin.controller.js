import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js';
import createSlug from '../utils/slugify.js';
import { sendOrderConfirmation, sendOrderShipped } from '../services/email.service.js';
import { stripHtml } from '../utils/sanitize.js';

async function ensureDefaultCoupons() {
  const defaults = [
    { code: 'PRINT10', type: 'percent', value: 10, minPurchase: 0, active: true },
    { code: 'ENVIOGRATIS', type: 'shipping', value: 0, minPurchase: 0, active: true }
  ];
  await Promise.all(defaults.map((coupon) =>
    Coupon.updateOne({ code: coupon.code }, { $setOnInsert: coupon }, { upsert: true })
  ));
}

export async function getBootstrap(req, res, next) {
  try {
    await ensureDefaultCoupons();
    await Product.updateMany(
      { image: { $exists: true, $ne: '' }, $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] },
      [{ $set: { images: ['$image'] } }]
    );
    const [products, orders, users, coupons, settings] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).limit(200),
      Order.find().sort({ createdAt: -1 }).limit(200).populate('user', 'name email'),
      User.find().sort({ createdAt: -1 }).limit(200).select('-password -resetToken -resetTokenExpires'),
      Coupon.find().sort({ createdAt: -1 }).limit(200),
      Settings.findOne({ key: 'main' })
    ]);

    res.json({
      success: true,
      products: products.map((product) => ({
        id: String(product._id),
        name: product.name,
        cat: product.category,
        price: product.price,
        oldPrice: product.oldPrice || 0,
        rating: product.rating,
        reviews: product.reviews,
        stock: product.stock,
        tags: product.tags || [],
        seed: product.seed || '',
        image: product.image || '',
        images: product.images || [],
        active: product.active,
        desc: product.description || '',
        variants: product.variants || { color: [], size: [] },
        sold: product.salesCount || 0
      })),
      orders,
      users: users.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
        avatar: user.avatar,
        blocked: user.blocked,
        createdAt: user.createdAt
      })),
      coupons,
      settings: settings || {}
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboard(req, res, next) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [monthlyRevenue, totalOrders, activeProducts, totalUsers] = await Promise.all([
      Order.aggregate([
        { $match: { payStatus: 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.countDocuments(),
      Product.countDocuments({ active: true }),
      User.countDocuments()
    ]);
    res.json({
      success: true,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      totalOrders,
      activeProducts,
      totalUsers
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesChart(req, res, next) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sales = await Order.aggregate([
      { $match: { payStatus: 'paid', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, sales });
  } catch (error) {
    next(error);
  }
}

export async function getTopProducts(req, res, next) {
  try {
    const products = await Product.find({ active: true })
      .sort({ salesCount: -1 })
      .limit(5)
      .select('name category salesCount image images');
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
}

export async function getRecentOrders(req, res, next) {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email');
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
}

export async function getRecentUsers(req, res, next) {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email avatar role createdAt');
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
}

// ==================== PRODUCTOS ====================

export async function listProducts(req, res, next) {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category && category !== 'all') query.category = category;
    if (status === 'active') query.active = true;
    if (status === 'inactive') query.active = false;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function createAdminProduct(req, res, next) {
  try {
    const data = { ...req.body };
    data.name = stripHtml(data.name || '');
    data.description = stripHtml(data.description || '');
    data.slug = createSlug(data.name);
    if (typeof data.images === 'string') {
      data.images = data.images.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (!data.images) data.images = [];
    if (data.images.length > 0 && !data.image) data.image = data.images[0];
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminProduct(req, res, next) {
  try {
    const data = { ...req.body };
    if (data.name) {
      data.name = stripHtml(data.name);
      data.slug = createSlug(data.name);
    }
    if (data.description) data.description = stripHtml(data.description);
    if (typeof data.images === 'string') {
      data.images = data.images.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (data.images && data.images.length > 0) data.image = data.images[0];
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    res.json({ success: true, message: 'Producto desactivado' });
  } catch (error) {
    next(error);
  }
}

export async function toggleAdminProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    product.active = !product.active;
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

// ==================== PEDIDOS ====================

export async function listOrders(req, res, next) {
  try {
    const { status, payMethod, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.payStatus = status;
    if (payMethod && payMethod !== 'all') query.payMethod = payMethod;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).populate('user', 'name email'),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getAdminOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { payStatus, shippingStatus } = req.body;
    const update = {};
    if (payStatus) update.payStatus = payStatus;
    if (shippingStatus) update.shippingStatus = shippingStatus;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

export async function resendOrderEmail(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    try {
      await sendOrderConfirmation(order);
      res.json({ success: true, message: 'Email reenviado' });
    } catch (emailError) {
      res.status(500).json({ success: false, message: 'No se pudo enviar el email' });
    }
  } catch (error) {
    next(error);
  }
}

export async function exportOrders(req, res, next) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
    const header = 'Numero,Cliente,Email,Total,Metodo,Pago,Envio,Fecha\n';
    const rows = orders.map((o) => {
      const customer = o.customer || {};
      const name = customer.name || o.user?.name || '';
      const email = customer.email || o.user?.email || '';
      const date = o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '';
      return `${o.number},"${name}","${email}",${o.total || 0},${o.payMethod || ''},${o.payStatus || ''},${o.shippingStatus || ''},${date}`;
    }).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.csv"');
    res.send(header + rows);
  } catch (error) {
    next(error);
  }
}

// ==================== USUARIOS ====================

export async function listUsers(req, res, next) {
  try {
    const { provider, role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (provider && provider !== 'all') query.provider = provider;
    if (role && role !== 'all') query.role = role;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).select('-password -resetToken'),
      User.countDocuments(query)
    ]);
    res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { role, blocked } = req.body;
    const update = {};
    if (role) update.role = role;
    if (typeof blocked === 'boolean') update.blocked = blocked;
    if (req.user && String(req.user._id) === req.params.id && role === 'user') {
      return res.status(400).json({ success: false, message: 'No podés cambiar tu propio rol' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    if (req.user && String(req.user._id) === req.params.id) {
      return res.status(400).json({ success: false, message: 'No podés eliminarte a vos mismo' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    next(error);
  }
}

// ==================== CUPONES ====================

export async function listCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
}

export async function createCoupon(req, res, next) {
  try {
    const data = { ...req.body };
    data.code = (data.code || '').trim().toUpperCase();
    const coupon = await Coupon.create(data);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const data = { ...req.body };
    if (data.code) data.code = data.code.trim().toUpperCase();
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
    res.json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Cupón eliminado' });
  } catch (error) {
    next(error);
  }
}

// ==================== SETTINGS ====================

export async function getSettings(req, res, next) {
  try {
    let settings = await Settings.findOne({ key: 'main' });
    if (!settings) settings = await Settings.create({ key: 'main' });
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}
