import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio.'],
      trim: true,
      maxlength: 180
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria.'],
      trim: true,
      maxlength: 5000
    },
    category: {
      type: String,
      required: [true, 'La categoría es obligatoria.'],
      trim: true,
      lowercase: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    oldPrice: {
      type: Number,
      default: null,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviews: {
      type: Number,
      min: 0,
      default: 0
    },
    image: { type: String, default: '' },
    seed: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    variants: {
      color: {
        type: [String],
        default: []
      },
      size: {
        type: [String],
        default: []
      }
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    salesCount: {
      type: Number,
      min: 0,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

productSchema.index({ category: 1, active: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Product', productSchema);
