import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let dbAvailable = true;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('⚠️  Database pool error:', err.message);
  dbAvailable = false;
});

export const isDatabaseAvailable = () => dbAvailable;

export const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inference_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
        message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        provider VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        latency_ms INTEGER,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        total_tokens INTEGER,
        cost_estimate DECIMAL(10, 6),
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        request_preview TEXT,
        response_preview TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_inference_logs_conversation ON inference_logs(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_inference_logs_created ON inference_logs(created_at);
    `);
    
    dbAvailable = true;
    console.log('✅ Database initialized successfully');
  } catch (error) {
    dbAvailable = false;
    console.error(' Database initialization failed:', error.message);
    console.error('  Running in degraded mode - database features disabled');
    console.error('  Please check your DATABASE_URL in .env file');
    throw error;
  }
};
