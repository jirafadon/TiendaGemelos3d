import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    qty: {
      type: Number,
      required: true,
      min: 1
    },
    variant: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    seed: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const emailSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    messageId: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      required: false,
      index: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: value => Array.isArray(value) && value.length > 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    shipping: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    payMethod: {
      type: String,
      required: true,
      trim: true
    },
    payStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      index: true
    },
    shippingStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true
    },
    externalId: {
      type: String,
      default: '',
      index: true
    },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, default: '', trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      zip: { type: String, required: true, trim: true }
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },
    emailsSent: {
      type: [emailSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });

export default mongoose.model('Order', orderSchema);
