import { IngestionService } from '../../../lib/services.js';
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

    const ingestionService = new IngestionService();
    const limit = parseInt(req.query.limit) || 100;
    const logs = await ingestionService.getRecentLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: error.message });
  }
};
