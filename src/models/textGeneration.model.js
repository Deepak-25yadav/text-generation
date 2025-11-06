import mongoose from 'mongoose';

const TextGenerationSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    model: { type: String },
    temperature: { type: Number },
    tokens: { type: Number },
  },
  { timestamps: true, collection: 'textgeneration' }
);

export const TextGeneration = mongoose.model('TextGeneration', TextGenerationSchema);


