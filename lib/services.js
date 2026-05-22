import { pool } from './db.js';
import { redis, withCache } from './redis.js';

export class ConversationService {
  createConversation = async (sessionId) => {
    const result = await pool.query(
      `INSERT INTO conversations (session_id, status) 
       VALUES ($1, 'active') 
       RETURNING *`,
      [sessionId]
    );
    
    // Invalidate cache
    if (redis) await redis.del('conversations:list');
    
    return this.mapRow(result.rows[0]);
  };

  getConversationBySession = async (sessionId) => {
    const result = await pool.query(
      `SELECT * FROM conversations WHERE session_id = $1`,
      [sessionId]
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  };

  listConversations = async (limit = 50) => {
    return withCache(
      'conversations:list',
      async () => {
        const result = await pool.query(
          `SELECT * FROM conversations WHERE status != 'cancelled' ORDER BY updated_at DESC LIMIT $1`,
          [limit]
        );
        return result.rows.map(this.mapRow);
      },
      60 // Cache for 1 minute
    );
  };

  getConversation = async (id) => {
    return withCache(
      `conversation:${id}`,
      async () => {
        const result = await pool.query(
          `SELECT * FROM conversations WHERE id = $1`,
          [id]
        );
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
      },
      300 // Cache for 5 minutes
    );
  };

  updateConversation = async (id, updates) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);

    await pool.query(
      `UPDATE conversations SET ${fields.join(', ')} WHERE id = $${paramCount}`,
      values
    );
    
    // Invalidate cache
    if (redis) {
      await redis.del(`conversation:${id}`);
      await redis.del('conversations:list');
    }
  };

  addMessage = async (conversationId, role, content) => {
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, role, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [conversationId, role, content]
    );

    await pool.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId]
    );
    
    // Invalidate cache
    if (redis) {
      await redis.del(`messages:${conversationId}`);
      await redis.del(`conversation:${conversationId}`);
      await redis.del('conversations:list');
    }
    
    return this.mapMessage(result.rows[0]);
  };

  getMessages = async (conversationId) => {
    return withCache(
      `messages:${conversationId}`,
      async () => {
        const result = await pool.query(
          `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
          [conversationId]
        );
        return result.rows.map(this.mapMessage);
      },
      60 // Cache for 1 minute
    );
  };

  mapRow = (row) => ({
    id: row.id,
    sessionId: row.session_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  mapMessage = (row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  });
}

export class IngestionService {
  ingestLog = async (log, messageId) => {
    await pool.query(
      `INSERT INTO inference_logs (
        id, conversation_id, message_id, provider, model, 
        latency_ms, prompt_tokens, completion_tokens, total_tokens,
        cost_estimate, status, error_message, request_preview, 
        response_preview, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        log.id, log.conversationId, messageId || null, log.provider, log.model,
        log.latencyMs, log.promptTokens || null, log.completionTokens || null,
        log.totalTokens || null, log.costEstimate || null, log.status,
        log.errorMessage || null, log.requestPreview || null,
        log.responsePreview || null, JSON.stringify(log.metadata || {}),
        log.createdAt,
      ]
    );
    
    // Invalidate analytics cache
    if (redis) {
      await redis.del('analytics:dashboard');
      await redis.del('analytics:logs');
    }
  };

  getAnalytics = async (startDate, endDate) => {
    const cacheKey = `analytics:${startDate || 'all'}:${endDate || 'all'}`;
    
    return withCache(
      cacheKey,
      async () => {
        const dateFilter = startDate && endDate 
          ? `WHERE created_at BETWEEN $1 AND $2`
          : '';
        const params = startDate && endDate ? [startDate, endDate] : [];

        const [stats, providerStats, errorRate] = await Promise.all([
          pool.query(`
            SELECT 
              COUNT(*) as total_requests,
              AVG(latency_ms) as avg_latency,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50_latency,
              PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
              PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency,
              SUM(total_tokens) as total_tokens,
              SUM(cost_estimate) as total_cost
            FROM inference_logs ${dateFilter}
          `, params),
          
          pool.query(`
            SELECT 
              provider, model,
              COUNT(*) as request_count,
              AVG(latency_ms) as avg_latency,
              SUM(total_tokens) as total_tokens
            FROM inference_logs ${dateFilter}
            GROUP BY provider, model
          `, params),
          
          pool.query(`
            SELECT 
              COUNT(CASE WHEN status = 'error' THEN 1 END)::float / NULLIF(COUNT(*)::float, 0) as error_rate
            FROM inference_logs ${dateFilter}
          `, params),
        ]);

        return {
          overview: stats.rows[0],
          byProvider: providerStats.rows,
          errorRate: errorRate.rows[0].error_rate || 0,
        };
      },
      300 // Cache for 5 minutes
    );
  };

  getRecentLogs = async (limit = 100) => {
    return withCache(
      `logs:recent:${limit}`,
      async () => {
        const result = await pool.query(
          `SELECT * FROM inference_logs ORDER BY created_at DESC LIMIT $1`,
          [limit]
        );
        return result.rows.map(this.mapLog);
      },
      60 // Cache for 1 minute
    );
  };

  mapLog = (row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    provider: row.provider,
    model: row.model,
    latencyMs: row.latency_ms,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    costEstimate: parseFloat(row.cost_estimate),
    status: row.status,
    errorMessage: row.error_message,
    requestPreview: row.request_preview,
    responsePreview: row.response_preview,
    metadata: row.metadata,
    createdAt: row.created_at,
  });
}
