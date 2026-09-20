import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js';
import createSlug from '../utils/slugify.js';
import { sendOrderConfirmation, sendOrderShipped } from '../services/email.service.js';


export async function getBootstrap(req, res, next) {
  try {
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
        active: product.active,
        sold: product.salesCount || 0,
        desc: product.description,
        variants: product.variants || { color: [], size: [] }
      })),
      orders: orders.map((order) => ({
        id: String(order._id),
        number: order.number,
        customer: order.customer?.name || order.user?.name || 'Cliente',
        email: order.customer?.email || order.user?.email || '',
        total: order.total,
        payment: order.payMethod,
        status: order.shippingStatus || 'pending',
        created: order.createdAt,
        history: (order.statusHistory || []).map((entry) => entry.status)
      })),
      users: users.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar || `https://picsum.photos/seed/user-${String(user._id)}/80/80`,
        provider: user.provider || 'local',
        role: user.role,
        blocked: Boolean(user.blocked),
        date: user.createdAt
      })),
      coupons: coupons.map((coupon) => ({
        id: String(coupon._id),
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        max: coupon.maxUses,
        used: coupon.usedCount,
        expires: coupon.expiresAt,
        active: coupon.active
      })),
      settings: {
        storeName: settings?.storeName || 'Tienda Gemelos 3D',
        storeEmail: settings?.storeEmail || process.env.ADMIN_EMAIL || '',
        storePhone: settings?.storePhone || '',
        storeAddress: settings?.storeAddress || '',
        shippingCost: settings?.shippingCost ?? 2500,
        freeShippingMinimum: settings?.freeShippingMin ?? 50000,
        maintenance: settings?.maintenanceMode ?? false,
        allowRegistration: settings?.allowRegister ?? true,
        allowGuestCheckout: settings?.allowGuestCheckout ?? false
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboard(req, res, next) {
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const [sales, orders, products, users] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: start }, payStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.countDocuments({ createdAt: { $gte: start } }),
      Product.countDocuments({ active: true }),
      User.countDocuments()
    ]);

    res.json({
      success: true,
      kpis: {
        salesMonth: sales[0]?.total || 0,
        totalOrders: orders,
        activeProducts: products,
        registeredUsers: users
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesChart(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 6);

    const rows = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start },
          payStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const map = new Map(rows.map(row => [row._id, row.total]));
    const labels = [];
    const values = [];

    for (let index = 0; index < 7; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      labels.push(date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' }));
      values.push(map.get(key) || 0);
    }

    res.json({ success: true, labels, values });
  } catch (error) {
    next(error);
  }
}

export async function getTopProducts(req, res, next) {
  try {
    const products = await Product.find({ active: true })
      .sort({ salesCount: -1 })
      .limit(5)
      .select('name category price stock salesCount rating seed');

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
      .limit(10)
      .select('-password -resetToken -resetTokenExpires');

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
}

export async function listProducts(req, res, next) {
  try {
    const { page = 1, limit = 10, search, category, active } = req.query;
    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const filter = {};

    if (search?.trim()) filter.$text = { $search: search.trim() };
    if (category) filter.category = String(category).toLowerCase();
    if (active !== undefined) filter.active = active === 'true';

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage),
      Product.countDocuments(filter)
    ]);

    res.json({ success: true, products, pagination: { page: currentPage, limit: perPage, total, pages: Math.ceil(total / perPage) } });
  } catch (error) {
    next(error);
  }
}

export async function createAdminProduct(req, res, next) {
  try {
    const payload = {
      ...req.body,
      category: req.body.category || req.body.cat,
      description: req.body.description || req.body.desc,
      slug: createSlug(req.body.slug || req.body.name),
      createdBy: req.user._id
    };
    delete payload.cat;
    delete payload.desc;
    delete payload.id;
    const product = await Product.create(payload);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminProduct(req, res, next) {
  try {
    const payload = {
      ...req.body,
      category: req.body.category || req.body.cat,
      description: req.body.description || req.body.desc,
      slug: createSlug(req.body.slug || req.body.name)
    };
    delete payload.cat;
    delete payload.desc;
    delete payload.id;
    const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });

    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function toggleAdminProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    product.active = !product.active;
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function listOrders(req, res, next) {
  try {
    const { page = 1, limit = 10, payStatus, shippingStatus, from, to, status } = req.query;
    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const filter = {};

    if (payStatus) filter.payStatus = payStatus;
    if (shippingStatus) filter.shippingStatus = shippingStatus;
    if (status) filter.shippingStatus = status;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
        .populate('user', 'name email'),
      Order.countDocuments(filter)
    ]);

    res.json({ success: true, orders, pagination: { page: currentPage, limit: perPage, total, pages: Math.ceil(total / perPage) } });
  } catch (error) {
    next(error);
  }
}

export async function getAdminOrder(req, res, next) {
  try {
    const order = await Order.findOne({ $or: [{ _id: req.params.id }, { number: req.params.id }] }).populate('user', 'name email avatar role');
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { status, note = '' } = req.body;
    const allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido.' });
    }

    const order = await Order.findOne({ $or: [{ _id: req.params.id }, { number: req.params.id }] });
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });

    if (status === 'paid') order.payStatus = 'paid';
    if (status === 'shipped') {
      order.shippingStatus = 'shipped';
      if (order.payStatus === 'pending') order.payStatus = 'paid';
    }
    if (status === 'delivered') order.shippingStatus = 'delivered';
    if (status === 'cancelled') {
      order.shippingStatus = 'cancelled';
      if (order.payStatus === 'pending') order.payStatus = 'cancelled';
    }
    if (status === 'pending') order.shippingStatus = 'pending';

    order.statusHistory.push({ status, date: new Date(), note });
    await order.save();

    if (status === 'shipped') {
      await sendOrderShipped(order, req.body.tracking || 'No informado');
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

export async function resendOrderEmail(req, res, next) {
  try {
    const order = await Order.findOne({ $or: [{ _id: req.params.id }, { number: req.params.id }] });
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });

    await sendOrderConfirmation(order);
    order.emailsSent.push({ type: 'order_confirmation_resend', sentAt: new Date() });
    await order.save();

    res.json({ success: true, message: 'Email reenviado.' });
  } catch (error) {
    next(error);
  }
}

export async function exportOrders(req, res, next) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const headers = ['number', 'customer', 'email', 'total', 'payMethod', 'payStatus', 'shippingStatus', 'createdAt'];
    const rows = orders.map(order => [
      order.number,
      order.customer.name,
      order.customer.email,
      order.total,
      order.payMethod,
      order.payStatus,
      order.shippingStatus,
      order.createdAt.toISOString()
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="printlab-pedidos.csv"');
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    const { page = 1, limit = 10, provider, role, blocked } = req.query;
    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const filter = {};

    if (provider) filter.provider = provider;
    if (role) filter.role = role;
    if (blocked !== undefined) filter.blocked = blocked === 'true';

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage),
      User.countDocuments(filter)
    ]);

    res.json({ success: true, users, pagination: { page: currentPage, limit: perPage, total, pages: Math.ceil(total / perPage) } });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    if (String(req.params.id) === String(req.user._id) && req.body.role && req.body.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'No podés quitarte tus propios permisos de administrador.' });
    }

    const allowed = ['name', 'avatar', 'role', 'blocked'];
    const payload = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'No podés eliminar tu propia cuenta desde el panel.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

    res.json({ success: true, message: 'Usuario eliminado.' });
  } catch (error) {
    next(error);
  }
}

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
    const coupon = await Coupon.create({
      ...req.body,
      code: String(req.body.code || '').trim().toUpperCase()
    });
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const payload = {
      ...req.body,
      ...(req.body.code !== undefined ? { code: String(req.body.code).trim().toUpperCase() } : {})
    };
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Cupón no encontrado.' });
    res.json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Cupón no encontrado.' });
    res.json({ success: true, message: 'Cupón eliminado.' });
  } catch (error) {
    next(error);
  }
}

export async function getSettings(req, res, next) {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $setOnInsert: { key: 'main' } },
      { upsert: true, new: true }
    );
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const fields = [
      'storeName',
      'storeEmail',
      'storePhone',
      'storeAddress',
      'shippingCost',
      'freeShippingMin',
      'maintenanceMode',
      'allowRegister',
      'allowGuestCheckout'
    ];

    const payload = {};
    for (const field of fields) {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    }

    if (req.body.freeShippingMinimum !== undefined) payload.freeShippingMin = req.body.freeShippingMinimum;
    if (req.body.maintenance !== undefined) payload.maintenanceMode = req.body.maintenance;
    if (req.body.allowRegistration !== undefined) payload.allowRegister = req.body.allowRegistration;

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: payload, $setOnInsert: { key: 'main' } },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}
