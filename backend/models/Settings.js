import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'main',
      immutable: true
    },
    storeName: {
      type: String,
      default: 'PrintLab 3D',
      trim: true
    },
    storeEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    storePhone: {
      type: String,
      default: '',
      trim: true
    },
    storeAddress: {
      type: String,
      default: '',
      trim: true
    },
    shippingCost: {
      type: Number,
      default: 2500,
      min: 0
    },
    freeShippingMin: {
      type: Number,
      default: 50000,
      min: 0
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    allowRegister: {
      type: Boolean,
      default: true
    },
    allowGuestCheckout: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export default mongoose.model('Settings', settingsSchema);
