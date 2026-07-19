# Lilmissteee Telegram Marketing Bot

A complete production-ready Telegram Bot backend for the Lilmissteee Official brand.

## Stack
- Node.js + Express
- Supabase (PostgreSQL)
- Telegram Bot API

## Features
- `/start` command with user registration
- Referral system with deep links
- Analytics tracking
- Admin broadcast system
- Admin commands: `/stats`, `/users`, `/broadcast`, `/export`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials.

3. Run the Supabase schema in `supabase/schema.sql`.

4. Start the bot:
```bash
npm start
```

## Project Structure
```
src/
  config/
    supabase.js      - Supabase client
    telegram.js      - Telegram bot config
  routes/
    webhook.js       - Express webhook route
  commands/
    start.js         - /start command
    help.js          - /help command
    admin.js         - Admin commands
  services/
    referral.js      - Referral logic
    analytics.js     - Analytics tracking
    broadcast.js     - Broadcast engine
  utils/
    logger.js        - Winston logger
  index.js           - Main entry point
```

## License
MIT
