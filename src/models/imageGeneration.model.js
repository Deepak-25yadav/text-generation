import mongoose from 'mongoose';

const ImageGenerationSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    imageUrl: { type: String, required: true }, // S3 URL (permanent)
    revisedPrompt: { type: String },
    model: { type: String, default: 'dall-e-3' },
    size: { type: String, default: '1024x1024' },
    quality: { type: String, default: 'standard' },
    s3Key: { type: String }, // S3 object key for reference
  },
  { timestamps: true, collection: 'imagegeneration' }
);

export const ImageGeneration = mongoose.model('ImageGeneration', ImageGenerationSchema);

