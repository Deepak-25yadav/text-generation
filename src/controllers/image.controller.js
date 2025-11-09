import { generateImageFromPrompt } from '../services/image.service.js';
import { uploadBase64ToS3 } from '../services/s3.service.js';
import { ImageGeneration } from '../models/imageGeneration.model.js';

export async function generateImage(req, res) {
  try {
    const { prompt, size, quality } = req.body;

    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        error: 'Please provide a valid prompt in the request body' 
      });
    }

    // Validate size if provided (DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792)
    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    const imageSize = size && validSizes.includes(size) ? size : '1024x1024';

    // Validate quality if provided (DALL-E 3 supports: standard, hd)
    const validQualities = ['standard', 'hd'];
    const imageQuality = quality && validQualities.includes(quality) ? quality : 'standard';

    // Generate image using OpenAI DALL-E 3
    const { imageBase64, revisedPrompt, model, size: generatedSize, quality: generatedQuality } = 
      await generateImageFromPrompt(prompt, {
        model: 'dall-e-3',
        size: imageSize,
        quality: imageQuality,
        n: 1,
      });

    if (!imageBase64) {
      return res.status(500).json({ 
        error: 'Failed to generate image data' 
      });
    }

    // Upload base64 image to S3 for permanent storage
    const s3Result = await uploadBase64ToS3(
      imageBase64,
      `generated-image-${Date.now()}.png`
    );

    // Persist to MongoDB with S3 URL (permanent, never expires)
    await ImageGeneration.create({
      prompt,
      imageUrl: s3Result.Location, // Permanent S3 URL
      revisedPrompt,
      model,
      size: generatedSize,
      quality: generatedQuality,
      s3Key: s3Result.Key,
    });

    return res.json({
      success: true,
      prompt,
      revisedPrompt,
      imageUrl: s3Result.Location, // Return S3 URL instead of base64
      model,
      size: generatedSize,
      quality: generatedQuality,
    });

  } catch (error) {
    console.error('Error generating image:', error);

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
      error: 'Failed to generate image. Please try again later.',
      details: error.message,
    });
  }
}

