import { createAdgmQuiz, createAdgmQuizFromPrompt } from '../services/adgmQuiz.service.js';

export async function create(req, res) {
  try {
    // If 'prompt' provided, generate with OpenAI and save strictly to schema
    if (typeof req.body?.prompt === 'string' && req.body.prompt.trim().length > 0) {
      const options = {
        category: req.body.category === 'non-graded' ? 'non-graded' : 'graded',
        numQuestions: Number.isInteger(req.body.numQuestions) && req.body.numQuestions > 0 ? req.body.numQuestions : 5,
      };
      const created = await createAdgmQuizFromPrompt(req.body.prompt.trim(), options);
      return res.status(201).json({
        success: true,
        quiz: {
          id: created._id,
          category: created.category,
          questions: created.questions,
          gradedPassedText: created.gradedPassedText,
          gradedFailedText: created.gradedFailedText,
          gradedPassingCriteria: created.gradedPassingCriteria,
          gradedReattemptCount: created.gradedReattemptCount,
          non_gradedResultText: created.non_gradedResultText,
          createdAt: created.createdAt,
        },
      });
    }

    // Otherwise, treat body as direct quiz payload (strictly validated)
    const payload = req.body?.quiz || req.body;
    const created = await createAdgmQuiz(payload);
    return res.status(201).json({
      success: true,
      quiz: {
        id: created._id,
        category: created.category,
        questions: created.questions,
        gradedPassedText: created.gradedPassedText,
        gradedFailedText: created.gradedFailedText,
        gradedPassingCriteria: created.gradedPassingCriteria,
        gradedReattemptCount: created.gradedReattemptCount,
        non_gradedResultText: created.non_gradedResultText,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    const status = error.status || 400;
    return res.status(status).json({
      error: error.message || 'Failed to create ADGM Quiz',
    });
  }
}


