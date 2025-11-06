# OpenAI Text Generation Backend

A simple Express.js backend for generating text responses using OpenAI's API.

## Project Structure

```
text-generation-be/
├── package.json                 # Dependencies and scripts
├── server.js                    # App bootstrap (mounts routes, connects DB)
├── src/
│   ├── config/
│   │   └── db.js                # Mongoose connection
│   ├── controllers/
│   │   └── text.controller.js   # Controller for text generation
│   ├── models/
│   │   └── textGeneration.model.js # Mongoose schema/model
│   ├── routes/
│   │   └── text.routes.js       # Routes for /api
│   └── services/
│       └── openai.service.js    # OpenAI integration
├── .env                         # Environment variables (create this file)
└── README.md                    # This file
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create `.env` File**
   Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-3.5-turbo
  DB_URL=mongodb+srv://Deepak-Yadav:Deepak2000@cluster0.gg9lco5.mongodb.net/image-generation?appName=Cluster0
  DB_NAME=image-generation
   ```
   
   Replace `your_openai_api_key_here` with your actual OpenAI API key from https://platform.openai.com/api-keys

3. **Start the Server**
   ```bash
   npm start
   ```
   
   The server will run on `http://localhost:3000` (or the PORT specified in your .env file)

## API Endpoints

### POST `/api/generate`

Generate text from a prompt.

**Request Body:**
```json
{
  "prompt": "what is the electron"
}
```

**Response:**
```json
{
  "success": true,
  "prompt": "what is the electron",
  "response": "An electron is a subatomic particle..."
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "what is the electron"}'
```

**Example using JavaScript (fetch):**
```javascript
const response = await fetch('http://localhost:3000/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'what is the electron'
  })
});

const data = await response.json();
console.log(data.response);
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-3.5-turbo)

## Error Handling

The API includes error handling for:
- Missing or invalid prompts
- Missing API key
- Invalid API key
- Rate limit errors
- General server errors

## MongoDB

- Uses Mongoose to connect via `DB_URL`.
- Database: `image-generation` (configurable via `DB_NAME`).
- Collection: `textgeneration`.
- Each document stores: `question`, `answer`, `model`, `temperature`, `tokens`, and timestamps.

