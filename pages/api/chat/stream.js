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
    const conversationService = new ConversationService();
    const ingestionService = new IngestionService();

    let conversation = await conversationService.getConversationBySession(sessionId);
    
    if (!conversation) {
      conversation = await conversationService.createConversation(sessionId);
    }

    // Redact PII from user message before storing
    const redactedMessage = redactPII(message);
    await conversationService.addMessage(conversation.id, 'user', redactedMessage);

    const messages = await conversationService.getMessages(conversation.id);
    const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    for await (const { chunk, log } of llmWrapper.chatStream(chatHistory, conversation.id)) {
      if (chunk) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      
      if (log) {
        // Redact PII from assistant response before storing
        const redactedResponse = redactPII(fullResponse);
        const assistantMessage = await conversationService.addMessage(
          conversation.id,
          'assistant',
          redactedResponse
        );
        
        await ingestionService.ingestLog(log, assistantMessage.id);

        if (!conversation.title && messages.length === 1) {
          const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
          await conversationService.updateConversation(conversation.id, { title });
        }

        res.write(`data: ${JSON.stringify({ 
          done: true, 
          conversationId: conversation.id,
          sessionId: conversation.sessionId 
        })}\n\n`);
      }
    }

    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};
