import { Router } from 'express';
import Settings from '../models/Settings.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ key: 'main' }).lean();
    if (!settings) settings = await Settings.create({ key: 'main' }).then((doc) => doc.toObject());
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
});

export default router;
