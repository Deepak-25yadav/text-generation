import { Router } from 'express';
import { generateText } from '../controllers/text.controller.js';

const router = Router();

router.post('/generate', generateText);

export default router;


