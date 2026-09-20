import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import createSlug from './slugify.js';

const products = [
  { name: 'Dragón articulado', category: 'figuras', price: 18500, oldPrice: 22000, stock: 18, rating: 4.9, reviews: 87, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=800&fit=crop&q=80', seed: 'dragon-articulado', tags: ['hot', 'oferta'], description: 'Dragón articulado impreso en 3D, flexible y listo para exhibir o regalar.', variants: { color: ['Negro', 'Rojo', 'Verde'], size: ['Mediano', 'Grande'] } },
  { name: 'Gato astronauta', category: 'figuras', price: 14500, oldPrice: null, stock: 24, rating: 4.8, reviews: 51, image: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=800&h=800&fit=crop&q=80', seed: 'gato-astronauta', tags: ['nuevo'], description: 'Figura decorativa de gato astronauta con detalles inspirados en exploración espacial.', variants: { color: ['Blanco', 'Negro'], size: ['Único'] } },
  { name: 'Calavera geométrica', category: 'decoracion', price: 12500, oldPrice: 15000, stock: 15, rating: 4.7, reviews: 42, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop&q=80', seed: 'calavera-geometrica', tags: ['oferta'], description: 'Calavera de diseño geométrico para escritorio, biblioteca o estantería.', variants: { color: ['Negro', 'Gris', 'Blanco'], size: ['Mediana'] } },
  { name: 'Maceta hexagonal', category: 'decoracion', price: 9800, oldPrice: null, stock: 31, rating: 4.6, reviews: 39, image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&h=800&fit=crop&q=80', seed: 'maceta-hexagonal', tags: ['nuevo'], description: 'Maceta hexagonal liviana con drenaje y estética minimalista.', variants: { color: ['Terracota', 'Blanco', 'Negro'], size: ['S', 'M', 'L'] } },
  { name: 'Organizador modular de escritorio', category: 'funcionales', price: 16000, oldPrice: 19000, stock: 12, rating: 4.9, reviews: 65, image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=800&fit=crop&q=80', seed: 'organizador-escritorio', tags: ['oferta', 'hot'], description: 'Sistema modular para ordenar lápices, cables, herramientas y accesorios.', variants: { color: ['Negro', 'Blanco', 'Gris'], size: ['3 módulos', '5 módulos'] } },
  { name: 'Soporte para celular', category: 'funcionales', price: 6500, oldPrice: null, stock: 45, rating: 4.7, reviews: 103, image: 'https://images.unsplash.com/photo-1582897291400-5c8b1b4f3f2b?w=800&h=800&fit=crop&q=80', seed: 'soporte-celular', tags: [], description: 'Soporte de escritorio compacto para celular con ángulo cómodo de visualización.', variants: { color: ['Negro', 'Blanco', 'Azul'], size: ['Único'] } },
  { name: 'Miniatura guerrero medieval', category: 'miniaturas', price: 7500, oldPrice: null, stock: 37, rating: 4.8, reviews: 28, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&h=800&fit=crop&q=80', seed: 'guerrero-medieval', tags: ['nuevo'], description: 'Miniatura detallada de guerrero medieval ideal para colección o pintura.', variants: { color: ['Gris', 'Blanco'], size: ['28 mm', '32 mm'] } },
  { name: 'Set de barriles medievales', category: 'miniaturas', price: 6900, oldPrice: 8200, stock: 22, rating: 4.6, reviews: 19, image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&h=800&fit=crop&q=80', seed: 'barriles-medievales', tags: ['oferta'], description: 'Set de elementos de escenografía medieval para juegos de mesa.', variants: { color: ['Marrón', 'Gris'], size: ['Set x4'] } },
  { name: 'Coche de carrera miniatura', category: 'juguetes', price: 8900, oldPrice: null, stock: 29, rating: 4.9, reviews: 72, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&h=800&fit=crop&q=80', seed: 'coche-carrera', tags: ['hot'], description: 'Coche de carrera en miniatura con ruedas móviles y diseño deportivo.', variants: { color: ['Rojo', 'Negro', 'Azul'], size: ['1:32'] } },
  { name: 'Rompecabezas articulado', category: 'juguetes', price: 7200, oldPrice: null, stock: 34, rating: 4.5, reviews: 33, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=800&fit=crop&q=80', seed: 'rompecabezas-articulado', tags: [], description: 'Juguete de ingenio articulado pensado para manipular y explorar formas.', variants: { color: ['Arcoíris', 'Negro'], size: ['Único'] } },
  { name: 'Perilla de reemplazo universal', category: 'repuestos', price: 4200, oldPrice: null, stock: 50, rating: 4.4, reviews: 16, image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=800&h=800&fit=crop&q=80', seed: 'perilla-universal', tags: [], description: 'Perilla impresa en 3D para reemplazo de piezas domésticas compatibles.', variants: { color: ['Negro', 'Blanco'], size: ['6 mm', '8 mm'] } },
  { name: 'Clip para cable automotor', category: 'repuestos', price: 3800, oldPrice: 4500, stock: 65, rating: 4.6, reviews: 22, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop&q=80', seed: 'clip-automotor', tags: ['oferta'], description: 'Clip de reemplazo para organización y sujeción de cableado.', variants: { color: ['Negro'], size: ['Pequeño', 'Mediano'] } },
  { name: 'Llavero con nombre', category: 'personalizados', price: 5500, oldPrice: null, stock: 40, rating: 4.9, reviews: 91, image: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=800&h=800&fit=crop&q=80', seed: 'llavero-nombre', tags: ['personalizado', 'hot'], description: 'Llavero personalizado con nombre o palabra corta.', variants: { color: ['Negro', 'Blanco', 'Rojo', 'Azul'], size: ['5 cm', '7 cm'] } },
  { name: 'Cartel personalizado para puerta', category: 'personalizados', price: 13500, oldPrice: 16000, stock: 14, rating: 4.8, reviews: 44, image: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&h=800&fit=crop&q=80', seed: 'cartel-puerta', tags: ['personalizado', 'oferta'], description: 'Cartel personalizado para puerta con nombre, número o mensaje.', variants: { color: ['Negro', 'Blanco', 'Madera'], size: ['20 cm', '30 cm'] } },
  { name: 'Jarrón espiral', category: 'decoracion', price: 11900, oldPrice: null, stock: 17, rating: 4.7, reviews: 35, image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=800&h=800&fit=crop&q=80', seed: 'jarron-espiral', tags: [], description: 'Jarrón decorativo de líneas espiraladas para interiores modernos.', variants: { color: ['Blanco', 'Negro', 'Arena'], size: ['M', 'L'] } },
  { name: 'Soporte para auriculares', category: 'funcionales', price: 10900, oldPrice: 12900, stock: 20, rating: 4.8, reviews: 58, image: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&h=800&fit=crop&q=80', seed: 'soporte-auriculares', tags: ['oferta'], description: 'Base estable para mantener auriculares ordenados junto al escritorio.', variants: { color: ['Negro', 'Blanco'], size: ['Único'] } },
  { name: 'Dragón bebé coleccionable', category: 'miniaturas', price: 6300, oldPrice: null, stock: 41, rating: 4.9, reviews: 49, image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800&h=800&fit=crop&q=80', seed: 'dragon-bebe', tags: ['nuevo'], description: 'Pequeña figura de dragón bebé para coleccionistas y escritorios.', variants: { color: ['Verde', 'Violeta', 'Rojo'], size: ['Pequeño'] } },
  { name: 'Auto de juguete retro', category: 'juguetes', price: 8200, oldPrice: 9900, stock: 26, rating: 4.7, reviews: 31, image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=800&fit=crop&q=80', seed: 'auto-retro', tags: ['oferta'], description: 'Auto retro de juguete con ruedas giratorias y líneas clásicas.', variants: { color: ['Amarillo', 'Rojo', 'Celeste'], size: ['1:32'] } },
  { name: 'Adaptador de montaje para cámara', category: 'repuestos', price: 8700, oldPrice: null, stock: 13, rating: 4.5, reviews: 14, image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&h=800&fit=crop&q=80', seed: 'adaptador-camara', tags: [], description: 'Adaptador de montaje diseñado para accesorios de cámara compatibles.', variants: { color: ['Negro'], size: ['1/4 pulgada'] } },
  { name: 'Figura personalizada estilo mascota', category: 'personalizados', price: 24000, oldPrice: 28000, stock: 8, rating: 5, reviews: 18, image: 'https://images.unsplash.com/photo-1631545806609-35d8db5a0a68?w=800&h=800&fit=crop&q=80', seed: 'mascota-personalizada', tags: ['personalizado', 'nuevo'], description: 'Figura personalizada inspirada en tu mascota, sujeta a revisión del diseño.', variants: { color: ['A pedido'], size: ['10 cm', '15 cm'] } }
];

async function seed() {
  try {
    await connectDB();
    await Product.deleteMany({});

    const documents = products.map(product => ({
      ...product,
      slug: createSlug(product.name),
      salesCount: 0,
      active: true,
      createdBy: null
    }));

    await Product.insertMany(documents);

    await Coupon.findOneAndUpdate(
      { code: 'PRINT10' },
      {
        code: 'PRINT10',
        type: 'percent',
        value: 10,
        minPurchase: 0,
        maxUses: null,
        usedCount: 0,
        active: true,
        expiresAt: null
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
      const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12);
      await User.findOneAndUpdate(
        { email: process.env.SEED_ADMIN_EMAIL.toLowerCase().trim() },
        {
          name: process.env.SEED_ADMIN_NAME || 'Administrador',
          email: process.env.SEED_ADMIN_EMAIL.toLowerCase().trim(),
          password: passwordHash,
          role: 'admin',
          blocked: false
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Administrador seed creado/actualizado: ${process.env.SEED_ADMIN_EMAIL}`);
    } else {
      console.log('SEED_ADMIN_EMAIL/PASSWORD no configurados: no se creó administrador automáticamente.');
    }

    console.log(`Seed completado: ${documents.length} productos insertados y cupón PRINT10 disponible.`);
  } catch (error) {
    console.error('Error ejecutando seed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

export { products, seed };

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  await seed();
}
