
# Telegram Supabase AI Bot

A TypeScript Node.js application that creates a Telegram bot allowing users to query a Supabase database using natural language.

## Features

- 🤖 Natural language to SQL conversion using OpenAI
- 📊 Supabase database integration
- 💬 Telegram bot interface
- 🔐 User authorization and session management
- 📝 Query logging and error handling
- 🎯 TypeScript with full type safety

## Setup

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure environment variables:**
   Copy \`.env.example\` to \`.env\` and fill in your credentials:
   - Get Telegram bot token from @BotFather
   - Get OpenAI API key from OpenAI platform
   - Get Supabase credentials from your project settings

3. **Set up Supabase function for SQL execution:**
   Create this PostgreSQL function in your Supabase SQL editor:
   \`\`\`sql
   CREATE OR REPLACE FUNCTION exec_sql(query text)
   RETURNS json
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     result json;
   BEGIN
     EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
     RETURN result;
   END;
   $$;
   \`\`\`

4. **Update database schema:**
   Edit \`src/schemas/example-schema.ts\` with your actual database structure.

5. **Run the bot:**
   \`\`\`bash
   npm run dev  # Development with hot reload
   npm run build && npm start  # Production
   \`\`\`

## Usage

Send natural language queries to your bot:
- "Show me all users registered this month"
- "What's the total revenue for last quarter?"
- "List top 10 products by sales"

## Security Notes

- Use \`ALLOWED_USER_IDS\` to restrict access
- The bot uses read-only queries by default
- Always use service keys carefully
- Consider implementing rate limiting for production

## License

MIT