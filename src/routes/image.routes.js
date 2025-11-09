import { Router } from 'express';
import { generateImage } from '../controllers/image.controller.js';

const router = Router();

router.post('/generate', generateImage);

export default router;

