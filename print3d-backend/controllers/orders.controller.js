import Order from '../models/Order.js';

export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req, res, next) {
  try {
    const query = req.user.role === 'admin'
      ? { $or: [{ _id: req.params.id }, { number: req.params.id }] }
      : {
          user: req.user._id,
          $or: [{ _id: req.params.id }, { number: req.params.id }]
        };

    const order = await Order.findOne(query).populate('user', 'name email avatar role');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
}
