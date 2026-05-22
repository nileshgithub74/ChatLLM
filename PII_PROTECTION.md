# 🛡️ PII Protection & Redaction

Your LLM Logging System automatically protects sensitive personal information (PII) before storing it in the database.

## What Gets Protected

The system automatically detects and redacts:

### 📧 Email Addresses
- **Example**: `john.doe@example.com`
- **Stored as**: `[EMAIL_REDACTED]`

### 📱 Phone Numbers
- **Example**: `+1-555-123-4567` or `(555) 123-4567`
- **Stored as**: `[PHONE_REDACTED]`

### 🔢 Social Security Numbers
- **Example**: `123-45-6789`
- **Stored as**: `[SSN_REDACTED]`

### 💳 Credit Card Numbers
- **Example**: `4532-1234-5678-9010`
- **Stored as**: `[CARD_REDACTED]`

## How It Works

### 1. **Real-time Detection**
When you send a message, the system scans for PII patterns using regex.

### 2. **Automatic Redaction**
Before storing in the database:
- User messages are redacted
- AI responses are redacted
- Log previews are redacted

### 3. **Original Message Preserved**
- The AI still receives the original message (for context)
- Only the stored version is redacted
- Your conversation remains natural

## Example

**You type:**
```
My email is john@example.com and my phone is 555-123-4567
```

**What AI sees:**
```
My email is john@example.com and my phone is 555-123-4567
```

**What gets stored in database:**
```
My email is [EMAIL_REDACTED] and my phone is [PHONE_REDACTED]
```

## Visual Indicator

Look for the green shield icon (🛡️) at the bottom of the chat:
> "PII Protection Active - Emails, phones, SSNs, and credit cards are automatically redacted"

## Privacy Benefits

✅ **Compliance**: Helps meet GDPR, CCPA, and other privacy regulations  
✅ **Security**: Reduces risk if database is compromised  
✅ **Audit Trail**: Logs show activity without exposing sensitive data  
✅ **Automatic**: No manual intervention required  

## Technical Details

- **Location**: `lib/llmWrapper.js`
- **Functions**: `redactPII()`, `detectPII()`
- **Applied in**: 
  - `/api/chat` - Regular chat endpoint
  - `/api/chat/stream` - Streaming chat endpoint
  - Inference logs - Request/response previews

## Testing PII Redaction

Try sending these messages to see redaction in action:

1. `My email is test@example.com`
2. `Call me at 555-123-4567`
3. `My SSN is 123-45-6789`
4. `My card number is 4532 1234 5678 9010`

Then check the database or analytics logs - you'll see the redacted versions!

---

**Note**: PII redaction is a security layer, not a replacement for proper access controls and encryption. Always follow security best practices.
