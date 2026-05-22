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
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const analytics = await ingestionService.getAnalytics(start, end);
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};
