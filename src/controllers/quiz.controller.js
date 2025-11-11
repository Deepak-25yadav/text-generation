import { generateQuizFromPrompt } from '../services/quiz.service.js';
import { Quiz } from '../models/quiz.model.js';

export async function generateQuiz(req, res) {
  try {
    const { title, description, numberOfQuestions, difficulty, questionType } = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Please provide a valid title in the request body'
      });
    }

    // Validate optional fields
    const validDifficulties = ['easy', 'medium', 'hard'];
    const quizDifficulty = difficulty && validDifficulties.includes(difficulty) 
      ? difficulty 
      : 'medium';

    const validQuestionTypes = ['multiple-choice', 'true-false', 'short-answer'];
    const quizQuestionType = questionType && validQuestionTypes.includes(questionType)
      ? questionType
      : 'multiple-choice';

    const numQuestions = numberOfQuestions && Number.isInteger(numberOfQuestions) && numberOfQuestions > 0 && numberOfQuestions <= 20
      ? numberOfQuestions
      : 5;

    // Generate quiz using OpenAI
    const quizData = await generateQuizFromPrompt(
      title.trim(),
      description?.trim() || '',
      {
        numberOfQuestions: numQuestions,
        difficulty: quizDifficulty,
        questionType: quizQuestionType,
      }
    );

     console.log("quizData in quiz.controller.js 🍕🍕",quizData)

    // Save quiz to MongoDB
    const savedQuiz = await Quiz.create({
      title: quizData.title,
      description: quizData.description,
      questions: quizData.questions,
      difficulty: quizData.difficulty,
      tags: quizData.tags,
      isActive: true,
    });

    return res.json({
      success: true,
      quiz: {
        id: savedQuiz._id,
        title: savedQuiz.title,
        description: savedQuiz.description,
        questions: savedQuiz.questions,
        totalPoints: savedQuiz.totalPoints,
        difficulty: savedQuiz.difficulty,
        tags: savedQuiz.tags,
        createdAt: savedQuiz.createdAt,
      },
      metadata: {
        model: quizData.model,
        tokens: quizData.tokens,
      },
    });

  } catch (error) {
    console.error('Error generating quiz:', error);

    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid OpenAI API key. Please check your .env file.'
      });
    }
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    return res.status(error.status || 500).json({
      error: 'Failed to generate quiz. Please try again later.',
      details: error.message,
    });
  }
}

export async function getQuiz(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Quiz ID is required' });
    }

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    return res.json({
      success: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        totalPoints: quiz.totalPoints,
        difficulty: quiz.difficulty,
        tags: quiz.tags,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return res.status(500).json({
      error: 'Failed to fetch quiz.',
      details: error.message,
    });
  }
}

export async function getAllQuizzes(req, res) {
  try {
    const quizzes = await Quiz.find({ isActive: true })
      .select('title description totalPoints difficulty tags createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      quizzes: quizzes.map(quiz => ({
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        totalPoints: quiz.totalPoints,
        difficulty: quiz.difficulty,
        tags: quiz.tags,
        createdAt: quiz.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return res.status(500).json({
      error: 'Failed to fetch quizzes.',
      details: error.message,
    });
  }
}

