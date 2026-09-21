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
    storeLogo: { type: String, default: '', trim: true },
    primaryColor: { type: String, default: '#8fd82e', trim: true },
    primaryColorHover: { type: String, default: '#6da020', trim: true },
    backgroundColor: { type: String, default: '#ffffff', trim: true },
    textColor: { type: String, default: '#2a2a2a', trim: true },
    footerColor: { type: String, default: '#1a1a1a', trim: true },
    headerColor: { type: String, default: '#ffffff', trim: true },
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
    storeWhatsApp: { type: String, default: '', trim: true },
    instagramUrl: { type: String, default: '', trim: true },
    facebookUrl: { type: String, default: '', trim: true },
    tiktokUrl: { type: String, default: '', trim: true },
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
