import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { calcTotals } from '../utils/helpers.js';

const DEFAULT_COUPONS = {
  PRINT10: { code: 'PRINT10', type: 'percent', value: 10, active: true, minPurchase: 0, maxUses: null, usedCount: 0, expiresAt: null },
  ENVIOGRATIS: { code: 'ENVIOGRATIS', type: 'shipping', value: 0, active: true, minPurchase: 0, maxUses: null, usedCount: 0, expiresAt: null }
};

async function resolveCoupon(code, subtotal) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return null;
  const coupon = await Coupon.findOne({ code: normalized, active: true }).lean() || DEFAULT_COUPONS[normalized];
  if (!coupon) return null;
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) return null;
  if (coupon.maxUses != null && Number(coupon.usedCount || 0) >= Number(coupon.maxUses)) return null;
  if (subtotal < Number(coupon.minPurchase || 0)) return null;
  return coupon;
}

export async function validateCoupon(req, res, next) {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ success: false, message: 'El carrito está vacío.' });
    const ids = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: ids }, active: true });
    const map = new Map(products.map(p => [String(p._id), p]));
    const normalized = [];
    for (const item of items) {
      const product = map.get(String(item.productId));
      if (!product) return res.status(400).json({ success: false, message: 'Uno de los productos ya no está disponible.' });
      const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
      if (product.stock < qty) return res.status(400).json({ success: false, message: `Stock insuficiente para ${product.name}.` });
      normalized.push({ productId: product._id, name: product.name, price: product.price, qty });
    }
    const coupon = await resolveCoupon(req.body.code, normalized.reduce((s, i) => s + i.price * i.qty, 0));
    if (!coupon) return res.status(400).json({ success: false, message: 'Cupón inválido, vencido o no aplicable.' });
    const totals = calcTotals({ items: normalized, shippingCost: 2500, freeShippingMin: 50000, coupon });
    res.json({ success: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, totals });
  } catch (error) { next(error); }
}
