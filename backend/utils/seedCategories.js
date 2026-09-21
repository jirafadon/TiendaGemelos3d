import Category from '../models/Category.js';

const DEFAULT_CATEGORIES = [
  { name: 'Figuras', slug: 'figuras', icon: 'fa-dragon', order: 0 },
  { name: 'Decoración', slug: 'decoracion', icon: 'fa-lightbulb', order: 1 },
  { name: 'Funcionales', slug: 'funcionales', icon: 'fa-gears', order: 2 },
  { name: 'Miniaturas', slug: 'miniaturas', icon: 'fa-chess-knight', order: 3 },
  { name: 'Juguetes', slug: 'juguetes', icon: 'fa-robot', order: 4 },
  { name: 'Repuestos', slug: 'repuestos', icon: 'fa-screwdriver-wrench', order: 5 },
  { name: 'Personalizados', slug: 'personalizados', icon: 'fa-wand-magic-sparkles', order: 6 }
];

export async function seedCategories() {
  const count = await Category.countDocuments();
  if (count > 0) return;
  await Category.insertMany(DEFAULT_CATEGORIES);
  console.log('Categorías iniciales creadas.');
}
