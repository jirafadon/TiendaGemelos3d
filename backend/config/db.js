import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI no está configurada.');
    }

    mongoose.set('strictQuery', true);
    const connection = await mongoose.connect(mongoUri);
    console.log(`MongoDB conectado: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error.message);
    process.exit(1);
  }
}
