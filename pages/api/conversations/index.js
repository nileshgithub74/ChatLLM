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

    const conversationService = new ConversationService();

    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit) || 50;
      const conversations = await conversationService.listConversations(limit);
      return res.json(conversations);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({ error: error.message });
  }
};
