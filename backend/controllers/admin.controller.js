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
  await Promise.all(defaults.map((coupon) => Coupon.updateOne({ code: coupon.code }, { $setOnInsert: coupon }, { upsert: true })));
}

export async function getBootstrap(req, res, next) {
  try {
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