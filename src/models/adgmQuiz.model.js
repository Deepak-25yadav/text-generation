import mongoose from 'mongoose';

// Option subdocument schema (strict)
const QuizOptionSchema = new mongoose.Schema(
  {
    option_heading: { type: String, required: true },
    feedback_text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true, strict: 'throw' }
);

// Question subdocument schema (strict)
const QuizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, default: '' },
    options: { type: [QuizOptionSchema], required: true },
    type: { type: String, required: true }, // e.g., 'radio' | 'checkbox'
    explanation: { type: String, default: '' },
    translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true, strict: 'throw' }
);

// Main ADGM Quiz schema (strict)
const AdgmQuizSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['graded', 'non-graded'], required: true },
    questions: { type: [QuizQuestionSchema], required: true },
    // marks: intentionally omitted as per requirement
    gradedPassedText: { type: String, default: '' },
    gradedFailedText: { type: String, default: '' },
    gradedPassingCriteria: { type: Number, default: 2 },
    gradedReattemptCount: { type: Number, default: 0 },
    non_gradedResultText: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'adgm_quizzes',
    strict: 'throw',
  }
);

export const AdgmQuiz = mongoose.model('AdgmQuiz', AdgmQuizSchema);


