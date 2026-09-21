import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { calcTotals, generateOrderNumber } from '../utils/helpers.js';
import { createMPPreference, getMPPayment } from '../services/mercadoPago.service.js';
import { createPayPalOrder, capturePayPalOrder } from '../services/paypal.service.js';
import { createStripeSession, validateStripeWebhook } from '../services/stripe.service.js';
import { sendOrderConfirmation, sendAdminNewOrder } from '../services/email.service.js';

function cleanCustomer(customer = {}) {
  return {
    name: String(customer.name || '').trim(),
    email: String(customer.email || '').toLowerCase().trim(),
    phone: String(customer.phone || '').trim(),
    address: String(customer.address || '').trim(),
    city: String(customer.city || '').trim(),
    zip: String(customer.zip || '').trim()
  };
}

const DEFAULT_COUPONS = {
  PRINT10: { code: 'PRINT10', type: 'percent', value: 10, active: true, minPurchase: 0, maxUses: null, usedCount: 0, expiresAt: null },
  ENVIOGRATIS: { code: 'ENVIOGRATIS', type: 'shipping', value: 0, active: true, minPurchase: 0, maxUses: null, usedCount: 0, expiresAt: null }
};

async function resolveCoupon(code, subtotal) {
  if (!code) return null;

  const normalizedCode = String(code).trim().toUpperCase();
  const storedCoupon = await Coupon.findOne({
    code: String(code).trim().toUpperCase(),
    active: true
  });
  const coupon = storedCoupon || DEFAULT_COUPONS[normalizedCode];

  if (!coupon) return null;
  if (coupon.expiresAt && coupon.expiresAt <= new Date()) return null;
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return null;
  if (subtotal < coupon.minPurchase) return null;

  return coupon;
}

async function buildOrder(req) {
  const { items = [], customer: rawCustomer, payMethod = 'mercadopago', couponCode } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('El carrito está vacío.');
    error.statusCode = 400;
    throw error;
  }

  const customer = cleanCustomer(rawCustomer);
  if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.city || !customer.zip) {
    const error = new Error('Faltan datos del cliente o de envío.');
    error.statusCode = 400;
    throw error;
  }

  const productIds = items.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, active: true });
  const productMap = new Map(products.map(product => [product._id.toString(), product]));

  const normalizedItems = [];

  for (const item of items) {
    const product = productMap.get(String(item.productId));

    if (!product) {
      const error = new Error('Uno de los productos ya no está disponible.');
      error.statusCode = 400;
      throw error;
    }

    const qty = Math.max(1, Math.floor(Number(item.qty) || 1));

    if (product.stock < qty) {
      const error = new Error(`Stock insuficiente para ${product.name}.`);
      error.statusCode = 400;
      throw error;
    }

    normalizedItems.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      qty,
      variant: item.variant || null,
      seed: product.seed || ''
    });
  }

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const coupon = await resolveCoupon(couponCode, subtotal);
  const totals = calcTotals({
    items: normalizedItems,
    shippingCost: 2500,
    freeShippingMin: 50000,
    coupon
  });

  const number = generateOrderNumber();

  const order = await Order.create({
    number,
    user: req.user?._id || null,
    items: normalizedItems,
    ...totals,
    payMethod,
    payStatus: 'pending',
    shippingStatus: 'pending',
    customer,
    statusHistory: [{
      status: 'pending',
      date: new Date(),
      note: 'Pedido creado.'
    }]
  });

  if (coupon) {
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
  }

  return order;
}

export async function checkout(req, res, next) {
  try {
    const order = await buildOrder(req);
    let payment = null;

    switch (String(order.payMethod).toLowerCase()) {
      case 'mercadopago':
      case 'mp':
        payment = await createMPPreference(order);
        break;
      case 'paypal':
        payment = await createPayPalOrder(order);
        break;
      case 'stripe':
        payment = await createStripeSession(order);
        break;
      case 'transfer':
      case 'bank_transfer':
        payment = { method: 'transfer', status: 'pending', message: 'Transferencia bancaria pendiente de confirmación.' };
        break;
      default: {
        await Order.findByIdAndDelete(order._id);
        const error = new Error('Método de pago no soportado.');
        error.statusCode = 400;
        throw error;
      }
    }

    await Promise.all(
      order.items.map(item => Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stock: -item.qty,
          salesCount: item.qty
        }
      }))
    );

    await Promise.all([
      sendOrderConfirmation(order),
      sendAdminNewOrder(order)
    ]);

    let redirectUrl = null;
    if (payment?.initPoint || payment?.sandboxInitPoint) {
      redirectUrl = payment.initPoint || payment.sandboxInitPoint;
    } else if (payment?.url) {
      redirectUrl = payment.url;
    } else if (payment?.approvalUrl) {
      redirectUrl = payment.approvalUrl;
    } else if (payment?.orderID) {
      redirectUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${encodeURIComponent(payment.orderID)}`;
    }

    res.status(201).json({
      success: true,
      orderNumber: order.number,
      redirectUrl,
      payMethod: order.payMethod,
      payment,
      bankDetails: String(order.payMethod).toLowerCase() === 'transfer' || String(order.payMethod).toLowerCase() === 'bank_transfer'
        ? {
            holder: process.env.BANK_HOLDER || '',
            cuit: process.env.BANK_CUIT || '',
            bank: process.env.BANK_NAME || '',
            alias: process.env.BANK_ALIAS || '',
            cbu: process.env.BANK_CBU || ''
          }
        : undefined
    });
  } catch (error) {
    next(error);
  }
}

export async function mpWebhook(req, res, next) {
  try {
    const paymentId = req.body?.data?.id || req.query['data.id'] || req.query.id;

    if (!paymentId) {
      return res.status(200).json({ success: true });
    }

    const payment = await getMPPayment(paymentId);
    const orderNumber = payment.external_reference;

    if (!orderNumber) {
      return res.status(200).json({ success: true });
    }

    const statusMap = {
      approved: 'paid',
      pending: 'pending',
      in_process: 'pending',
      rejected: 'failed',
      cancelled: 'cancelled',
      refunded: 'refunded'
    };

    const payStatus = statusMap[payment.status] || 'pending';

    await Order.findOneAndUpdate(
      { number: orderNumber },
      {
        payStatus,
        externalId: String(payment.id),
        $push: {
          statusHistory: {
            status: payStatus,
            date: new Date(),
            note: `Mercado Pago: ${payment.status}`
          }
        }
      }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function paypalCapture(req, res, next) {
  try {
    const { orderID, orderNumber } = req.body;

    if (!orderID || !orderNumber) {
      return res.status(400).json({ success: false, message: 'Faltan orderID y orderNumber.' });
    }

    const response = await capturePayPalOrder(orderID);
    const capture = response.result?.purchase_units?.[0]?.payments?.captures?.[0];
    const completed = response.result?.status === 'COMPLETED' || capture?.status === 'COMPLETED';

    const order = await Order.findOneAndUpdate(
      { number: orderNumber },
      {
        payStatus: completed ? 'paid' : 'pending',
        externalId: String(orderID),
        $push: {
          statusHistory: {
            status: completed ? 'paid' : 'pending',
            date: new Date(),
            note: `PayPal: ${response.result?.status || 'UNKNOWN'}`
          }
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
    }

    res.json({ success: true, order, paypal: response.result });
  } catch (error) {
    next(error);
  }
}

export async function stripeWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    const event = validateStripeWebhook(req.body, signature);

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const orderNumber = session.metadata?.orderNumber || session.client_reference_id;

      if (orderNumber) {
        await Order.findOneAndUpdate(
          { number: orderNumber },
          {
            payStatus: 'paid',
            externalId: session.payment_intent || session.id,
            $push: {
              statusHistory: {
                status: 'paid',
                date: new Date(),
                note: `Stripe: ${event.type}`
              }
            }
          }
        );
      }
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object;
      const orderNumber = session.metadata?.orderNumber || session.client_reference_id;

      if (orderNumber) {
        await Order.findOneAndUpdate(
          { number: orderNumber },
          {
            payStatus: 'failed',
            externalId: session.payment_intent || session.id,
            $push: {
              statusHistory: {
                status: 'failed',
                date: new Date(),
                note: 'Stripe: pago fallido.'
              }
            }
          }
        );
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
}
