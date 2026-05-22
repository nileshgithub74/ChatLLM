# 🤖 LLM Inference Logging & Ingestion System

A production-ready AI chatbot with enterprise-level monitoring, analytics, and automatic PII protection. Built with Next.js, PostgreSQL, Redis, and Google Gemini AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black.svg)

## ✨ Features

### 🎯 Core Functionality
- **AI Chatbot** - Multi-turn conversations with Google Gemini 2.5 Flash
- **Real-time Streaming** - Server-sent events for instant responses
- **Conversation Management** - List, resume, and delete conversations
- **Modern UI** - ChatGPT-like interface with dark theme

### 📊 Monitoring & Analytics
- **Automatic Logging** - Every AI interaction tracked automatically
- **Performance Metrics** - Latency, tokens, costs, error rates
- **Analytics Dashboard** - Real-time charts and insights
- **Latency Percentiles** - P50, P95, P99 tracking

### 🔐 Security & Privacy
- **PII Redaction** - Automatic removal of emails, phones, SSNs, credit cards
- **GDPR/CCPA Ready** - Compliance-friendly data handling
- **Secure Storage** - SSL/TLS encrypted database connections
- **Environment Variables** - Secrets management

### ⚡ Performance
- **Redis Caching** - Fast response times
- **Automatic Retries** - Handles API failures gracefully (up to 3 attempts)
- **Connection Pooling** - Efficient database connections
- **Serverless Ready** - Works with Neon & Upstash

## 🏗️ Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
┌──────▼──────────────────────────────────────┐
│         Next.js Frontend (React)             │
│  - Chat Interface                            │
│  - Analytics Dashboard                       │
└──────┬──────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────┐
│         Next.js API Routes                   │
│  - /api/chat/stream                          │
│  - /api/conversations                        │
│  - /api/analytics                            │
└──────┬──────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────┐
│         LLM Wrapper                          │
│  - PII Redaction                             │
│  - Automatic Logging                         │
│  - Retry Logic                               │
└──────┬──────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────┐
│         Google Gemini API                    │
└──────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────┐
│    PostgreSQL (Neon) + Redis (Upstash)      │
│  - Conversations                             │
│  - Messages                                  │
│  - Inference Logs                            │
└──────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key
- Neon PostgreSQL database
- Upstash Redis (optional)

### Option 1: Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Chat-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Neon Database URL
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Upstash Redis (Optional)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# Environment
NODE_ENV=development
```

4. **Run database migrations**
```bash
npm run db:migrate
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

### Option 2: Docker Compose (Recommended)

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Chat-app
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start with Docker Compose**
```bash
docker-compose up -d
```

4. **Run database migrations**
```bash
docker-compose exec app npm run db:migrate
```

5. **Access the application**
```
http://localhost:3000
```

## 📦 Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React, Next.js 14, Tailwind CSS |
| **Backend** | Next.js API Routes (Node.js) |
| **Database** | PostgreSQL (Neon) |
| **Cache** | Redis (Upstash) |
| **AI Model** | Google Gemini 2.5 Flash |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Deployment** | Docker, Vercel, or any Node.js host |

## 📁 Project Structure

```
Chat-app/
├── pages/
│   ├── index.js                 # Chat interface
│   ├── dashboard.js             # Analytics dashboard
│   ├── _app.js                  # App wrapper
│   ├── _document.js             # Document wrapper
│   └── api/
│       ├── chat.js              # Regular chat endpoint
│       ├── chat/
│       │   └── stream.js        # Streaming chat endpoint
│       ├── conversations/
│       │   ├── index.js         # List conversations
│       │   └── [id].js          # Get/delete conversation
│       └── analytics/
│           ├── dashboard.js     # Analytics metrics
│           └── logs.js          # Inference logs
├── lib/
│   ├── db.js                    # Database connection & schema
│   ├── llmWrapper.js            # LLM wrapper with logging & PII redaction
│   ├── services.js              # Business logic services
│   └── redis.js                 # Redis caching utilities
├── scripts/
│   ├── migrate.js               # Database migration
│   └── reset.js                 # Reset database
├── styles/
│   └── globals.css              # Global styles
├── public/
│   └── favicon.ico              # Favicon
├── .env.example                 # Environment variables template
├── docker-compose.yml           # Docker Compose configuration
├── Dockerfile                   # Docker image configuration
├── package.json                 # Dependencies
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── README.md                    # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | ✅ Yes |
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `UPSTASH_REDIS_REST_URL` | Redis REST URL | ⚠️ Optional |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token | ⚠️ Optional |
| `NODE_ENV` | Environment (development/production) | ✅ Yes |

### Getting API Keys

**Google Gemini API:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and paste into `.env`

**Neon PostgreSQL:**
1. Visit [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Paste into `.env`

**Upstash Redis (Optional):**
1. Visit [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy REST URL and token
4. Paste into `.env`

## 📊 Database Schema

### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  title TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Inference Logs Table
```sql
CREATE TABLE inference_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  provider VARCHAR(100),
  model VARCHAR(100),
  latency_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_estimate DECIMAL(10, 8),
  status VARCHAR(50),
  error_message TEXT,
  request_preview TEXT,
  response_preview TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🛡️ PII Protection

The system automatically redacts sensitive information before storing:

| Type | Pattern | Redacted As |
|------|---------|-------------|
| Email | `user@example.com` | `[EMAIL_REDACTED]` |
| Phone | `+1-555-123-4567` | `[PHONE_REDACTED]` |
| SSN | `123-45-6789` | `[SSN_REDACTED]` |
| Credit Card | `4532-1234-5678-9010` | `[CARD_REDACTED]` |

**How it works:**
1. User sends message with PII
2. AI receives original message (for context)
3. System redacts PII before storing in database
4. Logs show redacted versions only

## 📈 Analytics Metrics

The dashboard tracks:

- **Total Requests** - All AI interactions
- **Average Latency** - Response time in milliseconds
- **Total Cost** - Estimated API costs
- **Error Rate** - Percentage of failed requests
- **Latency Percentiles** - P50, P95, P99
- **Provider Stats** - Per-model metrics
- **Recent Logs** - Last 50 inference logs

## 🐳 Docker Support

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

### Commands
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

## 🧪 Testing

### Test PII Redaction
Send these messages to verify redaction:
```
My email is test@example.com
Call me at 555-123-4567
My SSN is 123-45-6789
My card is 4532 1234 5678 9010
```

Check the database or analytics - you'll see redacted versions!

### Reset Database
```bash
npm run db:reset
```

## 📝 API Endpoints

### Chat
- `POST /api/chat` - Regular chat (non-streaming)
- `POST /api/chat/stream` - Streaming chat (SSE)

### Conversations
- `GET /api/conversations` - List all conversations
- `GET /api/conversations/[id]` - Get conversation with messages
- `DELETE /api/conversations/[id]` - Delete (cancel) conversation

### Analytics
- `GET /api/analytics/dashboard` - Get analytics metrics
- `GET /api/analytics/logs?limit=50` - Get recent inference logs

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t llm-logging-system .
docker run -p 3000:3000 --env-file .env llm-logging-system
```

### Traditional Hosting
```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for the language model
- Neon for serverless PostgreSQL
- Upstash for serverless Redis
- Next.js team for the amazing framework
- Tailwind CSS for the styling system

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review the code comments

## 🔮 Future Enhancements

- [ ] Multi-provider support (OpenAI, Claude, etc.)
- [ ] Custom PII patterns
- [ ] Export analytics reports
- [ ] Webhook notifications
- [ ] Rate limiting
- [ ] User authentication
- [ ] Team collaboration
- [ ] API key management

---

**Built with ❤️ using Next.js, PostgreSQL, Redis, and Google Gemini AI**
