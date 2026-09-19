import mongoose from 'mongoose';
import { sendNewsletterWelcome } from '../services/email.service.js';

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

const Newsletter = mongoose.models.Newsletter || mongoose.model('Newsletter', newsletterSchema);

export async function subscribeNewsletter(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Ingresá un email válido.' });
    }

    const subscriber = await Newsletter.findOneAndUpdate(
      { email },
      { $set: { email, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendNewsletterWelcome(email);

    res.status(201).json({
      success: true,
      message: 'Suscripción realizada correctamente.',
      subscriber: { id: subscriber._id, email: subscriber.email }
    });
  } catch (error) {
    next(error);
  }
}
