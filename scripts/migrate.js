import { initDatabase } from '../lib/db.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const migrate = async () => {
  try {
    console.log('Running database migrations...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');
    await initDatabase();
    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
