# Telegram Authentication Setup Guide

This guide explains how to set up Telegram authentication for the MultiWallet application.

## Overview

Telegram authentication uses the official Telegram Login Widget, which provides a secure OAuth-like flow. When a user authenticates:
1. They click the "Connect with Telegram" button
2. Telegram Login Widget opens (web or mobile app)
3. User authorizes the bot
4. Backend verifies the authentication data using HMAC-SHA256
5. Backend sends a greeting message to the user via the bot
6. JWT token is issued for the session

## Step 1: Create a Telegram Bot

1. **Open Telegram** and search for [@BotFather](https://t.me/BotFather)
2. **Start a conversation** with BotFather
3. **Create a new bot**:
   ```
   /newbot
   ```
4. **Choose a name** for your bot (e.g., "MultiWallet")
5. **Choose a username** for your bot (must end in 'bot', e.g., "multiwallet_auth_bot")
6. **Save the bot token** - BotFather will give you a token like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

## Step 2: Configure Bot Settings

1. **Set the domain** for your bot (required for Login Widget):
   ```
   /setdomain
   ```
   Select your bot, then enter your domain:
   - For production: `line.depick.wtf` or your actual domain
   - For development with ngrok: `your-ngrok-id.ngrok-free.app`

2. **Set bot description** (optional but recommended):
   ```
   /setdescription
   ```
   Example: "MultiWallet authentication bot. Connect your Telegram account securely."

3. **Set about text** (optional):
   ```
   /setabouttext
   ```
   Example: "I help you connect your Telegram account to MultiWallet."

4. **Configure bot commands** for user interaction:
   ```
   /setcommands
   ```
   Select your bot, then paste this command list:
   ```
   start - Open DePick app
   help - Show available commands
   predict - Make a prediction
   balance - Check your balance
   claim - Claim rewards
   profile - View your profile
   ask - Ask SportsBuddy about football
   chat - Chat with SportsBuddy
   ```

## Step 3: Configure Backend Environment

Add these variables to `/Users/behrens/dev/DePick/DePick.BE/.env`:

```bash
# Telegram Authentication Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_USERNAME=multiwallet_auth_bot
```

**Important**:
- `TELEGRAM_BOT_TOKEN` is the token from BotFather
- `TELEGRAM_BOT_USERNAME` is the bot username (without @)

## Step 4: Configure Frontend Environment

Add these variables to `/Users/behrens/dev/DePick/MultiWallet/frontend/.env.local`:

```bash
# Telegram Configuration
VITE_TELEGRAM_BOT_USERNAME=multiwallet_auth_bot
VITE_BACKEND_URL=http://localhost:3001
```

For production or ngrok testing:
```bash
VITE_TELEGRAM_BOT_USERNAME=multiwallet_auth_bot
VITE_BACKEND_URL=https://your-ngrok-id.ngrok-free.app
```

## Step 5: Start the Services

### Backend (DePick.BE)
```bash
cd /Users/behrens/dev/DePick/DePick.BE
npm run start:dev
```

The backend will be available at `http://localhost:3001`

### Frontend (MultiWallet)
```bash
cd /Users/behrens/dev/DePick/MultiWallet/frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Testing the Integration

1. **Open the frontend** in your browser
2. **Click "Connect with Telegram"** button
3. **Authorize the bot** when Telegram opens
4. **Check the console** for debug logs in `sessionStorage.getItem('telegram_debug_logs')`
5. **Verify greeting message** arrives in your Telegram chat with the bot

## Security Notes

### How Authentication is Verified

The backend verifies Telegram authentication using HMAC-SHA256:

1. **Hash Calculation**:
   - Extract `hash` from auth data
   - Sort remaining fields alphabetically
   - Create data check string: `field1=value1\nfield2=value2\n...`
   - Generate secret key: `HMAC-SHA256("WebAppData", bot_token)`
   - Calculate hash: `HMAC-SHA256(data_check_string, secret_key)`
   - Compare with provided hash

2. **Expiration Check**:
   - Authentication data expires after 24 hours
   - Checked via `auth_date` timestamp

3. **Bot Token Security**:
   - Never expose bot token to frontend
   - Only used on backend for verification and sending messages

## API Endpoints

### POST /auth/telegram/verify

Verify Telegram authentication data and issue JWT token.

**Request Body**:
```json
{
  "id": 123456789,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "photo_url": "https://t.me/i/userpic/...",
  "auth_date": 1673123456,
  "hash": "abc123..."
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_data": {
    "provider": "TELEGRAM",
    "telegramId": 123456789,
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "photoUrl": "https://t.me/i/userpic/...",
    "verified": true
  }
}
```

**Error Response (400)**:
```json
{
  "statusCode": 400,
  "message": "Invalid Telegram authentication data"
}
```

## Bot Communication Features

### Two-Way Bot Interaction

The bot supports two types of commands:

#### 1. Performative Commands (Action Triggers)

These commands trigger specific actions in the app:

- `/start` - Opens the DePick web app
- `/help` - Shows list of available commands
- `/predict` - Opens the predictions page
- `/balance` - Shows user's balance (tokens/points)
- `/claim` - Claim available rewards
- `/profile` - Opens user profile page

**Implementation**: `/Users/behrens/dev/DePick/DePick.BE/src/auth/telegram/telegram-bot.service.ts`

#### 2. Conversational Commands (SportsBuddy LLM)

These commands interact with the SportsBuddy AI chatbot for football-related queries:

- `/ask [question]` - Ask a specific question about football
- `/chat [message]` - Have a conversation with SportsBuddy
- Plain text messages - Automatically forwarded to SportsBuddy

**Examples**:
```
/ask Who won the last Liverpool match?
/chat Tell me about the Premier League standings
What are the predictions for this weekend?
```

**SportsBuddy Integration**:
- Endpoint: `http://localhost:8000/chat`
- Uses RAG (Retrieval-Augmented Generation) for accurate football information
- Maintains conversation context per user via session IDs

### Bot Greeting Message

The greeting message is sent automatically after successful authentication. The message is dynamically generated by calling the SportsBuddy LLM at `localhost:8000/welcome/fixtures/{session_id}`.

**File**: `/Users/behrens/dev/DePick/DePick.BE/src/auth/telegram/telegram-auth.service.ts`

**Function**: `sendGreetingMessage()` → `getWelcomeMessage()`

You can modify this message by:
- Changing the endpoint at localhost:8000
- Updating the message format to include HTML formatting (`parse_mode: 'HTML'`)
- Adding links to resources or quick actions

## Architecture

### Authentication Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────1───▶│   Telegram   │────2───▶│    User     │
│ WalletModal │         │    Widget    │         │  Authorizes │
└─────────────┘         └──────────────┘         └─────────────┘
       │                                                  │
       │                                                  3
       │                                                  ▼
       │                                          ┌─────────────┐
       │◀──────────────────4─────────────────────│  Auth Data  │
       │                                          └─────────────┘
       │
       5
       ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Backend   │────6───▶│   Verify     │────7───▶│  Send Bot   │
│/auth/telegram│         │  HMAC Hash   │         │   Message   │
└─────────────┘         └──────────────┘         └─────────────┘
       │
       8
       ▼
┌─────────────┐
│  Issue JWT  │
│   Return    │
└─────────────┘
```

### Bot Communication Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │────1───▶│  Telegram    │────2───▶│   Backend   │
│  Sends      │         │     Bot      │         │ Bot Service │
│  Command    │         │   (Polling)  │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         3
                                          ┌──────────────┴──────────────┐
                                          ▼                             ▼
                                  ┌──────────────┐           ┌──────────────┐
                                  │ Performative │           │Conversational│
                                  │   Commands   │           │   Commands   │
                                  │ (/start,     │           │ (/ask, /chat,│
                                  │  /predict,   │           │   plain text)│
                                  │  /balance)   │           │              │
                                  └──────────────┘           └──────────────┘
                                          │                             │
                                          │                             4
                                          │                             ▼
                                          │                   ┌──────────────┐
                                          │                   │ SportsBuddy  │
                                          │                   │     LLM      │
                                          │                   │localhost:8000│
                                          │                   └──────────────┘
                                          │                             │
                                          5                             5
                                          ▼                             ▼
                                    ┌─────────────────────────────────────┐
                                    │      Send Response to User          │
                                    │      (via Telegram Bot API)         │
                                    └─────────────────────────────────────┘
```

## Additional Resources

- [Telegram Login Widget Documentation](https://core.telegram.org/widgets/login)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#botfather)

## Development Tips

1. **Debug Logs**: Check browser console for `telegram_debug_logs` in sessionStorage
2. **Backend Logs**: Look for `[TELEGRAM SERVICE]` and `[TELEGRAM AUTH]` prefixes
3. **Test with ngrok**: Use ngrok for local testing with proper domain
4. **Multiple Bots**: You can create separate bots for dev/staging/production

