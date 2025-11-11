import OpenAI from 'openai';

// Lazy initialization - create client only when needed
let client = null;

function getOpenAIClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw Object.assign(new Error('OpenAI API key missing'), { status: 500 });
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function generateQuizFromPrompt(title, description, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw Object.assign(new Error('OpenAI API key missing'), { status: 500 });
  }

  const openaiClient = getOpenAIClient();

  const {
    numberOfQuestions = 5,
    difficulty = 'medium',
    questionType = 'multiple-choice',
  } = options;

  // Create a detailed prompt for quiz generation
  const systemPrompt = `You are an expert quiz generator. Generate a quiz in JSON format based on the provided title and description.
The quiz should have exactly ${numberOfQuestions} questions of type "${questionType}" with difficulty level "${difficulty}".

For each question, provide:
- question: A clear and concise question
- options: An array of exactly 4 options (for multiple-choice) or 2 options (for true-false)
- correctAnswer: The correct answer (must match one of the options exactly)
- explanation: A brief explanation of why the correct answer is correct
- points: Points for this question (1-5, based on difficulty)
- difficulty: "${difficulty}"
- tags: Relevant tags for the question

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "title": "${title}",
  "description": "${description}",
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation here",
      "points": 1,
      "difficulty": "${difficulty}",
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

  const userPrompt = `Generate a quiz with the following details:
Title: ${title}
Description: ${description || 'No description provided'}
Number of Questions: ${numberOfQuestions}
Difficulty: ${difficulty}
Question Type: ${questionType}

Make sure the quiz is comprehensive, educational, and well-structured.`;

  try {
    const completion = await openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // Parse the JSON response
    let quizData;
    try {
      // Remove any markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      quizData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Error parsing quiz JSON:', parseError);
      throw new Error('Failed to parse quiz data from OpenAI response');
    }

    // Validate and structure the quiz data
    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error('Invalid quiz structure: questions array is missing or empty');
    }

    // Ensure all questions have required fields
    const validatedQuestions = quizData.questions.map((q, index) => ({
      question: q.question || `Question ${index + 1}`,
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Option A', 'Option B'],
      correctAnswer: q.correctAnswer || q.options?.[0] || 'Option A',
      explanation: q.explanation || '',
      points: q.points || 1,
      difficulty: q.difficulty || difficulty,
      tags: Array.isArray(q.tags) ? q.tags : [],
      questionType: q.questionType || questionType,
      isActive: true,
    }));

    return {
      title: quizData.title || title,
      description: quizData.description || description,
      questions: validatedQuestions,
      difficulty: quizData.difficulty || difficulty,
      tags: Array.isArray(quizData.tags) ? quizData.tags : [],
      tokens: completion.usage?.total_tokens,
      model: completion.model,
    };
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

