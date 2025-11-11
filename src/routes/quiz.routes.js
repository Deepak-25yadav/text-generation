import { Router } from 'express';
import { generateQuiz, getQuiz, getAllQuizzes } from '../controllers/quiz.controller.js';

const router = Router();

router.post('/generate', generateQuiz);
router.get('/', getAllQuizzes);
router.get('/:id', getQuiz);

export default router;

