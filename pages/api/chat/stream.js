import { LLMWrapper, redactPII } from '../../../lib/llmWrapper.js';
import { ConversationService, IngestionService } from '../../../lib/services.js';
import { initDatabase } from '../../../lib/db.js';

let dbInitialized = false;

const initDB = async () => {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
};

export default async function handler(req, res) {
  try {
    await initDB();

    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }

    const llmWrapper = new LLMWrapper(process.env.GEMINI_API_KEY);
    
    // Chat without database (stateless mode)
    const chatHistory = [{ role: 'user', content: message }];
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    try {
      for await (const { chunk, log } of llmWrapper.chatStream(chatHistory, sessionId)) {
        if (chunk) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
        
        if (log) {
          res.write(`data: ${JSON.stringify({ 
            done: true, 
            conversationId: sessionId,
            sessionId: sessionId 
          })}\n\n`);
        }
      }
    } catch (llmError) {
      console.error('LLM Error:', llmError);
      res.write(`data: ${JSON.stringify({ error: llmError.message })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Database unavailable. Please check your connection.' });
  }
};
