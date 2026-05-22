
let redisClient = null;

const getRedisClient = () => {
  if (!redisClient && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      
      get: async (key) => {
        try {
          const response = await fetch(`${redisClient.url}/get/${key}`, {
            headers: { Authorization: `Bearer ${redisClient.token}` }
          });
          const data = await response.json();
          return data.result;
        } catch (error) {
          console.error('Redis GET error:', error);
          return null;
        }
      },
      
      set: async (key, value, expirySeconds = 300) => {
        try {
          const response = await fetch(`${redisClient.url}/set/${key}`, {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${redisClient.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value, ex: expirySeconds })
          });
          return await response.json();
        } catch (error) {
          console.error('Redis SET error:', error);
          return null;
        }
      },
      
      del: async (key) => {
        try {
          const response = await fetch(`${redisClient.url}/del/${key}`, {
            headers: { Authorization: `Bearer ${redisClient.token}` }
          });
          return await response.json();
        } catch (error) {
          console.error('Redis DEL error:', error);
          return null;
        }
      }
    };
  }
  return redisClient;
};

export const redis = getRedisClient();

// Cache wrapper function
export const withCache = async (key, fetchFn, ttl = 300) => {
  if (!redis) {
    return await fetchFn();
  }

  // Try to get from cache
  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return cached;
    }
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Store in cache
  await redis.set(key, JSON.stringify(data), ttl);
  
  return data;
};
