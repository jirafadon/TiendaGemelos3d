import mongoose from 'mongoose';

const cache = globalThis.mongooseCache || {
  connection: null,
  promise: null
};

globalThis.mongooseCache = cache;

export async function connectDB() {
  if (cache.connection?.connection?.readyState === 1) {
    return cache.connection;
  }

  if (cache.promise) {
    return cache.promise;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI no está configurada.');
  }

  mongoose.set('strictQuery', true);

  cache.promise = mongoose.connect(mongoUri)
    .then((connection) => {
      cache.connection = connection;
      console.log(`MongoDB conectado: ${connection.connection.host}/${connection.connection.name}`);
      return connection;
    })
    .catch((error) => {
      cache.promise = null;
      cache.connection = null;
      console.error('Error al conectar con MongoDB:', error.message);
      throw error;
    });

  return cache.promise;
}