import { Router } from 'express';
import { create } from '../controllers/adgmQuiz.controller.js';

const router = Router();

// POST /api/adgm-quiz
router.post('/', create);

export default router;


