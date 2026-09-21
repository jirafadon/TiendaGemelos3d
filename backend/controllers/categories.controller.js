import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import createSlug from '../utils/slugify.js';

function normalizeCategoryPayload(body = {}) {
  const name = String(body.name || '').trim();
  const slug = String(body.slug || createSlug(name)).trim().toLowerCase();
  return {
    name,
    slug,
    icon: String(body.icon || 'fa-cube').trim() || 'fa-cube',
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    active: body.active !== false,
    description: String(body.description || '').trim()
  };
}

function duplicateMessage(error) {
  if (error?.code !== 11000) return null;
  const field = Object.keys(error.keyPattern || {})[0];
  return field === 'slug' ? 'El slug ya está en uso.' : 'El nombre ya está en uso.';
}

export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find({ active: true })
      .sort({ order: 1, name: 1 })
      .select('_id name slug icon order');
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

export async function listAdminCategories(req, res, next) {
  try {
    const categories = await Category.find()
      .sort({ order: 1, name: 1 })
      .lean();
    const counts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(counts.map((item) => [String(item._id || ''), item.count]));
    res.json({
      success: true,
      categories: categories.map((category) => ({
        ...category,
        productCount: countMap.get(String(category.slug)) || 0
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminCategory(req, res, next) {
  try {
    const payload = normalizeCategoryPayload(req.body);
    if (!payload.name || !payload.slug) {
      return res.status(400).json({ success: false, message: 'Nombre y slug son obligatorios.' });
    }
    const category = await Category.create(payload);
    res.status(201).json({ success: true, category });
  } catch (error) {
    const message = duplicateMessage(error);
    if (message) return res.status(400).json({ success: false, message });
    next(error);
  }
}

export async function updateAdminCategory(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Categoría inválida.' });
    }
    const payload = normalizeCategoryPayload(req.body);
    if (!payload.name || !payload.slug) {
      return res.status(400).json({ success: false, message: 'Nombre y slug son obligatorios.' });
    }
    const collision = await Category.findOne({
      _id: { $ne: req.params.id },
      $or: [{ name: payload.name }, { slug: payload.slug }]
    }).select('_id');
    if (collision) {
      return res.status(400).json({ success: false, message: 'El nombre o slug ya está en uso.' });
    }
    const category = await Category.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
    res.json({ success: true, category });
  } catch (error) {
    const message = duplicateMessage(error);
    if (message) return res.status(400).json({ success: false, message });
    next(error);
  }
}

export async function deleteAdminCategory(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Categoría inválida.' });
    }
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
    const productCount = await Product.countDocuments({
      category: { $in: [category.slug, category.name.toLowerCase()] }
    });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar: hay ${productCount} productos asociados`
      });
    }
    await category.deleteOne();
    res.json({ success: true, message: 'Categoría eliminada.' });
  } catch (error) {
    next(error);
  }
}

export async function reorderAdminCategories(req, res, next) {
  try {
    const items = Array.isArray(req.body?.order) ? req.body.order : [];
    if (!items.length) return res.status(400).json({ success: false, message: 'No hay categorías para reordenar.' });
    const operations = items
      .filter((item) => mongoose.isValidObjectId(item?._id))
      .map((item) => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { order: Number(item.order) || 0 } }
        }
      }));
    if (operations.length) await Category.bulkWrite(operations);
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}
