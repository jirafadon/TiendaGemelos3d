import mongoose from 'mongoose';

let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI no está configurada.');
  }

  mongoose.set('strictQuery', true);
  connectionPromise = mongoose.connect(mongoUri)
    .then(connection => {
      console.log(`MongoDB conectado: ${connection.connection.host}/${connection.connection.name}`);
      return connection;
    })
    .catch(error => {
      connectionPromise = null;
      console.error('Error al conectar con MongoDB:', error.message);
      throw error;
    });

  return connectionPromise;
}
