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

export async function generateTextFromPrompt(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw Object.assign(new Error('OpenAI API key missing'), { status: 500 });
  }

  const openaiClient = getOpenAIClient();

  // Using Chat Completions for broader compatibility
  const completion = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
  });

  const text = completion.choices[0]?.message?.content || '';
  const tokens = completion.usage?.total_tokens;
  return { text, tokens, model: completion.model };
}


