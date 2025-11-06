import { generateTextFromPrompt } from '../services/openai.service.js';
import { TextGeneration } from '../models/textGeneration.model.js';

export async function generateText(req, res) {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid prompt in the request body' });
    }

    const { text, tokens, model } = await generateTextFromPrompt(prompt);

    // Persist to MongoDB (image-generation DB, textgeneration collection)
    await TextGeneration.create({
      question: prompt,
      answer: text,
      model,
      temperature: 0.7,
      tokens: tokens ?? undefined,
    });

    return res.json({ success: true, prompt, response: text });
  } catch (error) {
    console.error('Error generating text:', error);

    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid OpenAI API key. Please check your .env file.' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    return res.status(error.status || 500).json({
      error: 'Failed to generate text. Please try again later.',
      details: error.message,
    });
  }
}


