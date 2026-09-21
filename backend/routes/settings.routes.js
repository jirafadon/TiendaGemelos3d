import { Router } from 'express';
import Settings from '../models/Settings.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ key: 'main' }).lean();
    if (!settings) settings = await Settings.create({ key: 'main' }).then((doc) => doc.toObject());
    const publicSettings = settings.toObject ? settings.toObject() : { ...settings };
    delete publicSettings.mpAccessToken;
    publicSettings.mpEnabled = !!publicSettings.mpEnabled;
    publicSettings.transferEnabled = publicSettings.transferEnabled !== false;
    publicSettings.cashEnabled = !!publicSettings.cashEnabled;
    publicSettings.cashInstructions = publicSettings.cashInstructions || 'Coordinar retiro por WhatsApp';
    res.json({ success: true, settings: publicSettings });
  } catch (error) {
    next(error);
  }
});

export default router;
