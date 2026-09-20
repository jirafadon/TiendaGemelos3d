import Product from '../models/Product.js';
import createSlug from '../utils/slugify.js';

function normalizeVariants(variants = {}) {
  return {
    color: Array.isArray(variants.color) ? variants.color.filter(Boolean).map(String) : [],
    size: Array.isArray(variants.size) ? variants.size.filter(Boolean).map(String) : []
  };
}

function productPayload(body, userId) {
  const images = Array.isArray(body.images) ? body.images.map(String).filter(Boolean).slice(0, 6) : [];
  const image = String(body.image || images[0] || '');

  return {
    name: String(body.name || '').trim(),
    slug: createSlug(body.slug || body.name),
    description: String(body.description || '').trim(),
    category: String(body.category || '').trim().toLowerCase(),
    price: Number(body.price),
    oldPrice: body.oldPrice === '' || body.oldPrice == null ? null : Number(body.oldPrice),
    stock: Number(body.stock || 0),
    rating: Number(body.rating || 0),
    reviews: Number(body.reviews || 0),
    seed: String(body.seed || ''),
    images,
    image: image || images[0] || '',

    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    variants: normalizeVariants(body.variants),
    active: body.active !== false,
    ...(userId ? { createdBy: userId } : {})
  };
}

export async function getProducts(req, res, next) {
  try {
    const {
      category,
      sort = 'popular',
      search,
      maxPrice,
      page = 1,
      limit = 12
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(limit) || 12));
    const filter = { active: true };

    if (category) filter.category = String(category).toLowerCase();
    if (maxPrice !== undefined && Number.isFinite(Number(maxPrice))) {
      filter.price = { $lte: Number(maxPrice) };
    }
    if (search?.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const sortMap = {
      popular: { salesCount: -1, createdAt: -1 },
      new: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1, reviews: -1 }
    };

    const sortValue = sortMap[sort] || sortMap.popular;
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortValue)
        .skip((currentPage - 1) * perPage)
        .limit(perPage),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await Product.findOne({ _id: req.params.id, active: true });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function getProductBySlug(req, res, next) {
  try {
    const product = await Product.findOne({ slug: req.params.slug, active: true });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const payload = productPayload(req.body, req.user._id);
    const product = await Product.create(payload);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const payload = productPayload(req.body);
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    res.json({ success: true, message: 'Producto desactivado.', product });
  } catch (error) {
    next(error);
  }
}

export async function toggleProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    product.active = !product.active;
    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}
