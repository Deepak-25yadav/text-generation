import { AdgmQuiz } from '../models/adgmQuiz.model.js';
import OpenAI from 'openai';

// Lazy OpenAI client
let client = null;
function getOpenAIClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw Object.assign(new Error('OPENAI_API_KEY missing'), { status: 500 });
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

// Validate payload strictly: only allowed fields on root and nested documents
export function sanitizeAndEnforceAdgmQuizPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw Object.assign(new Error('Invalid payload'), { status: 400 });
  }

  const allowedRootKeys = new Set([
    'category',
    'questions',
  ]);

  // Root: reject extra keys
  for (const key of Object.keys(payload)) {
    if (!allowedRootKeys.has(key)) {
      throw Object.assign(new Error(`Unexpected field '${key}' on quiz`), { status: 400 });
    }
  }

  const { category, questions } = payload;

  if (!['graded', 'non-graded'].includes(category)) {
    throw Object.assign(new Error('category must be "graded" or "non-graded"'), { status: 400 });
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    throw Object.assign(new Error('questions must be a non-empty array'), { status: 400 });
  }

  const allowedQuestionKeys = new Set(['question', 'options', 'type', 'explanation', 'translations', '_id']);
  const allowedOptionKeys = new Set(['option_heading', 'feedback_text', 'isCorrect', 'translations', '_id']);

  const sanitizedQuestions = questions.map((q) => {
    if (!q || typeof q !== 'object') {
      throw Object.assign(new Error('Invalid question item'), { status: 400 });
    }
    for (const key of Object.keys(q)) {
      if (!allowedQuestionKeys.has(key)) {
        throw Object.assign(new Error(`Unexpected field '${key}' on question`), { status: 400 });
      }
    }
    if (!Array.isArray(q.options) || q.options.length === 0) {
      throw Object.assign(new Error('Each question must include a non-empty options array'), { status: 400 });
    }
    const sanitizedOptions = q.options.map((o) => {
      if (!o || typeof o !== 'object') {
        throw Object.assign(new Error('Invalid option item'), { status: 400 });
      }
      for (const key of Object.keys(o)) {
        if (!allowedOptionKeys.has(key)) {
          throw Object.assign(new Error(`Unexpected field '${key}' on option`), { status: 400 });
        }
      }
      if (typeof o.option_heading !== 'string') {
        throw Object.assign(new Error('option_heading must be a string'), { status: 400 });
      }
      if (typeof o.feedback_text !== 'string') {
        throw Object.assign(new Error('feedback_text must be a string'), { status: 400 });
      }
      if (typeof o.isCorrect !== 'boolean') {
        throw Object.assign(new Error('isCorrect must be a boolean'), { status: 400 });
      }
      return {
        option_heading: o.option_heading,
        feedback_text: o.feedback_text,
        isCorrect: o.isCorrect,
        translations: o.translations && typeof o.translations === 'object' ? o.translations : {},
      };
    });
    return {
      question: typeof q.question === 'string' ? q.question : '',
      options: sanitizedOptions,
      type: q.type, // caller must ensure 'radio' | 'checkbox' or any required value
      explanation: typeof q.explanation === 'string' ? q.explanation : '',
      translations: q.translations && typeof q.translations === 'object' ? q.translations : {},
    };
  });

  return {
    category,
    questions: sanitizedQuestions,
    // Fixed values strictly required
    gradedPassedText: '',
    gradedFailedText: '',
    gradedPassingCriteria: 2,
    gradedReattemptCount: 0,
    non_gradedResultText: '',
  };
}

export async function createAdgmQuiz(payload) {
  const doc = sanitizeAndEnforceAdgmQuizPayload(payload);
  const created = await AdgmQuiz.create(doc);
  return created;
}

// Use OpenAI to generate an ADGM quiz that matches the strict schema
export async function generateAdgmQuizFromPrompt(prompt, { category = 'graded', numQuestions = 5 } = {}) {
  if (!prompt || typeof prompt !== 'string') {
    throw Object.assign(new Error('prompt is required'), { status: 400 });
  }
  if (!['graded', 'non-graded'].includes(category)) {
    throw Object.assign(new Error('category must be "graded" or "non-graded"'), { status: 400 });
  }
  const openai = getOpenAIClient();

  const systemPrompt = `
You are an expert quiz creator. Generate a quiz JSON STRICTLY matching this schema:
{
  "category": "graded" | "non-graded",
  "questions": [
    {
      "question": "string",
      "options": [
        { "option_heading": "string", "feedback_text": "string", "isCorrect": true|false, "translations": {} }
      ],
      "type": "radio" | "checkbox",
      "explanation": "string",
      "translations": {}
    }
  ]
}

Rules:
- Return ONLY valid JSON (no markdown).
- Create exactly ${numQuestions} questions.
- For "radio", exactly one option has isCorrect=true. For "checkbox", one or more options may be true.
- Each option must include option_heading, feedback_text, isCorrect. translations fields are empty objects {} unless needed.
- Do not include any fields beyond the schema above.
- category must be "${category}".
`;

  const userPrompt = `
Create an ADGM quiz for this prompt/context:
${prompt}
`;
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 3500,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices?.[0]?.message?.content || '{}';
  const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let data = {};
  try {
    data = JSON.parse(cleanedContent);
  } catch (e) {
    throw Object.assign(new Error('Failed to parse OpenAI response'), { status: 500 });
  }

  // Enforce schema and fixed defaults
  const sanitized = sanitizeAndEnforceAdgmQuizPayload({
    category: data.category || category,
    questions: Array.isArray(data.questions) ? data.questions : [],
  });

  return sanitized;
}

export async function createAdgmQuizFromPrompt(prompt, options = {}) {
  const generated = await generateAdgmQuizFromPrompt(prompt, options);
  // Do not store the prompt; only store the generated quiz
  const created = await AdgmQuiz.create(generated);
  return created;
}


