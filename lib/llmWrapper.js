import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_REGEX = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

export const redactPII = (text) => {
  return text
    .replace(EMAIL_REGEX, '[EMAIL_REDACTED]')
    .replace(PHONE_REGEX, '[PHONE_REDACTED]')
    .replace(SSN_REGEX, '[SSN_REDACTED]')
    .replace(CREDIT_CARD_REGEX, '[CARD_REDACTED]');
};

export const detectPII = (text) => {
  const found = [];
  if (EMAIL_REGEX.test(text)) found.push('email');
  if (PHONE_REGEX.test(text)) found.push('phone');
  if (SSN_REGEX.test(text)) found.push('SSN');
  if (CREDIT_CARD_REGEX.test(text)) found.push('credit card');
  return found;
};

const createPreview = (text, maxLength = 200) => {
  const redacted = redactPII(text);
  return redacted.length > maxLength 
    ? redacted.substring(0, maxLength) + '...' 
    : redacted;
};

export class LLMWrapper {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.provider = 'gemini';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  chat = async (messages, conversationId, model = 'gemini-2.5-flash') => {
    const startTime = Date.now();
    const logId = uuidv4();

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const geminiModel = this.genAI.getGenerativeModel({ model });
        
        const chat = geminiModel.startChat({
          history: messages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const response = result.response.text();
        
        const latency = Date.now() - startTime;
        const promptTokens = this.estimateTokens(lastMessage);
        const completionTokens = this.estimateTokens(response);
        
        const log = {
          id: logId,
          conversationId,
          provider: this.provider,
          model,
          latencyMs: latency,
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          costEstimate: this.estimateCost(promptTokens, completionTokens, model),
          status: 'success',
          requestPreview: createPreview(lastMessage),
          responsePreview: createPreview(response),
          metadata: { messagesCount: messages.length, attempts: attempt },
          createdAt: new Date(),
        };

        return { response, log };
      } catch (error) {
        console.error(`Attempt ${attempt}/${this.maxRetries} failed:`, error.message);
        
        if (attempt === this.maxRetries || error.status === 400 || error.status === 401) {
          const latency = Date.now() - startTime;
          
          const log = {
            id: logId,
            conversationId,
            provider: this.provider,
            model,
            latencyMs: latency,
            status: 'error',
            errorMessage: error.message,
            requestPreview: createPreview(messages[messages.length - 1]?.content || ''),
            metadata: { attempts: attempt },
            createdAt: new Date(),
          };

          throw error;
        }
        
        await this.sleep(this.retryDelay * attempt);
      }
    }
  };

  chatStream = async function* (messages, conversationId, model = 'gemini-2.5-flash') {
    const startTime = Date.now();
    const logId = uuidv4();
    let fullResponse = '';

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const geminiModel = this.genAI.getGenerativeModel({ model });
        
        const chat = geminiModel.startChat({
          history: messages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessageStream(lastMessage);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          fullResponse += text;
          yield { chunk: text };
        }

        const latency = Date.now() - startTime;
        const promptTokens = this.estimateTokens(lastMessage);
        const completionTokens = this.estimateTokens(fullResponse);

        const log = {
          id: logId,
          conversationId,
          provider: this.provider,
          model,
          latencyMs: latency,
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          costEstimate: this.estimateCost(promptTokens, completionTokens, model),
          status: 'success',
          requestPreview: createPreview(lastMessage),
          responsePreview: createPreview(fullResponse),
          metadata: { messagesCount: messages.length, streaming: true, attempts: attempt },
          createdAt: new Date(),
        };

        yield { chunk: '', log };
        return;
      } catch (error) {
        console.error(`Stream attempt ${attempt}/${this.maxRetries} failed:`, error.message);
        
        if (attempt === this.maxRetries || error.status === 400 || error.status === 401) {
          const latency = Date.now() - startTime;
          
          const log = {
            id: logId,
            conversationId,
            provider: this.provider,
            model,
            latencyMs: latency,
            status: 'error',
            errorMessage: error.message,
            requestPreview: createPreview(messages[messages.length - 1]?.content || ''),
            metadata: { attempts: attempt },
            createdAt: new Date(),
          };

          yield { chunk: '', log };
          throw error;
        }
        
        await this.sleep(this.retryDelay * attempt);
      }
    }
  };

  estimateTokens = (text) => Math.ceil(text.length / 4);

  estimateCost = (promptTokens, completionTokens, model) => {
    const rates = {
      'gemini-2.5-flash': { prompt: 0.00025, completion: 0.0005 },
      'gemini-1.5-flash-8b': { prompt: 0.00025, completion: 0.0005 },
      'gemini-1.5-flash-latest': { prompt: 0.00025, completion: 0.0005 },
      'gemini-1.5-flash': { prompt: 0.00025, completion: 0.0005 },
      'gemini-pro': { prompt: 0.00025, completion: 0.0005 },
    };

    const rate = rates[model] || rates['gemini-2.5-flash'];
    return (promptTokens / 1000) * rate.prompt + (completionTokens / 1000) * rate.completion;
  };
}
