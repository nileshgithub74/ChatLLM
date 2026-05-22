import { ConversationService } from '../../../lib/services.js';
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

    const { id } = req.query;
    const conversationService = new ConversationService();

    if (req.method === 'GET') {
      const conversation = await conversationService.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const messages = await conversationService.getMessages(id);
      
      return res.json({
        ...conversation,
        messages,
      });
    }

    if (req.method === 'DELETE') {
      await conversationService.updateConversation(id, { status: 'cancelled' });
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Conversation error:', error);
    res.status(500).json({ error: error.message });
  }
};
