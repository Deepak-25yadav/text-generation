import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './src/config/db.js';
import textRoutes from './src/routes/text.routes.js';
import imageRoutes from './src/routes/image.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'OpenAI Text Generation API is running!' });
});

// API routes
app.use('/api', textRoutes);
app.use('/api/image', imageRoutes);

async function start() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();


