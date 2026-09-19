import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ['percent', 'fixed', 'shipping'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    maxUses: {
      type: Number,
      default: null,
      min: 0
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    expiresAt: {
      type: Date,
      default: null
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

couponSchema.pre('validate', function validateCoupon(next) {
  if (this.type === 'percent' && this.value > 100) {
    return next(new Error('Un cupón porcentual no puede superar el 100%.'));
  }
  next();
});

export default mongoose.model('Coupon', couponSchema);
