import OpenAI from 'openai';
import https from 'https';

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

export async function generateImageFromPrompt(prompt, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw Object.assign(new Error('OpenAI API key missing'), { status: 500 });
  }

  const openaiClient = getOpenAIClient();

  const {
    model = 'dall-e-3',
    size = '1024x1024',
    quality = 'standard',
    n = 1,
  } = options;

  // Using Images API for image generation (DALL-E 3)
  // Note: DALL-E 3 only supports n=1, sizes: '1024x1024', '1792x1024', '1024x1792'
  // Quality: 'standard' or 'hd'
  const response = await openaiClient.images.generate({
    model,
    prompt,
    size,
    quality,
    n: 1, // DALL-E 3 always generates 1 image
  });

  // Extract image URL
  const imageUrl = response.data[0]?.url || null;
  const revisedPrompt = response.data[0]?.revised_prompt || prompt;
  console.log("revisedPrompt from service😍😍", revisedPrompt);
  console.log("imageUrl from service😍😍", imageUrl);

  // Convert URL to base64
  let imageBase64 = null;
  if (imageUrl) {
    try {
      imageBase64 = await new Promise((resolve, reject) => {
        https.get(imageUrl, (response) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer.toString('base64'));
          });
          response.on('error', reject);
        }).on('error', reject);
      });
    } catch (error) {
      console.error('Error converting image URL to base64:', error);
      throw new Error('Failed to process generated image');
    }
  }
//   console.log("imageBase64 from service😍😍", imageBase64);
  return {
    imageBase64,
    revisedPrompt,
    model: response.model || model,
    size,
    quality,
  };
}

