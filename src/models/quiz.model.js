import mongoose from 'mongoose';

// QuizQuestionSchema - nested schema for quiz questions
const QuizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true, validate: { validator: (v) => v.length >= 2 } },
    correctAnswer: { type: String, required: true },
    explanation: { type: String },
    points: { type: Number, default: 1, min: 1 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    tags: { type: [String], default: [] },
    timeLimit: { type: Number, min: 0 }, // in seconds
    questionType: { type: String, enum: ['multiple-choice', 'true-false', 'short-answer'], default: 'multiple-choice' },
    mediaUrl: { type: String },
    hints: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

// Quiz Schema - main schema containing quiz questions
const QuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    questions: { type: [QuizQuestionSchema], required: true, validate: { validator: (v) => v.length > 0 } },
    totalPoints: { type: Number, default: 0 },
    estimatedTime: { type: Number, min: 0 }, // in minutes
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true, collection: 'quizzes' }
);

// Calculate total points before saving
QuizSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  }
  next();
});

export const Quiz = mongoose.model('Quiz', QuizSchema);

