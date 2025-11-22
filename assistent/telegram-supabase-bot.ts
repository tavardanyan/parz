// package.json
{
  "name": "telegram-supabase-ai-bot",
  "version": "1.0.0",
  "description": "Telegram bot that converts natural language to SQL queries for Supabase",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "telegraf": "^4.16.3",
    "openai": "^4.70.0",
    "dotenv": "^16.4.5",
    "zod": "^3.23.8",
    "winston": "^3.15.0"
  },
  "devDependencies": {
    "@types/node": "^22.9.0",
    "typescript": "^5.6.3",
    "tsx": "^4.19.2",
    "@typescript-eslint/eslint-plugin": "^8.12.0",
    "@typescript-eslint/parser": "^8.12.0",
    "eslint": "^9.14.0"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}

// .env.example
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
ALLOWED_USER_IDS=123456789,987654321
NODE_ENV=development

// src/config/index.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  ALLOWED_USER_IDS: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('Environment validation failed:', envResult.error.format());
  process.exit(1);
}

export const config = {
  telegram: {
    token: envResult.data.TELEGRAM_BOT_TOKEN,
    allowedUserIds: envResult.data.ALLOWED_USER_IDS?.split(',').map(id => parseInt(id.trim())) || [],
  },
  openai: {
    apiKey: envResult.data.OPENAI_API_KEY,
  },
  supabase: {
    url: envResult.data.SUPABASE_URL,
    anonKey: envResult.data.SUPABASE_ANON_KEY,
    serviceKey: envResult.data.SUPABASE_SERVICE_KEY,
  },
  app: {
    isDevelopment: envResult.data.NODE_ENV === 'development',
  },
};

// src/types/index.ts
export interface DatabaseSchema {
  tables: TableSchema[];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  relationships?: RelationshipSchema[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  foreignKey?: ForeignKeySchema;
}

export interface ForeignKeySchema {
  table: string;
  column: string;
}

export interface RelationshipSchema {
  type: 'one-to-many' | 'many-to-one' | 'one-to-one';
  table: string;
  column: string;
  foreignColumn: string;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  query?: string;
}

export interface UserSession {
  userId: number;
  username?: string;
  lastQuery?: string;
  queryCount: number;
}

// src/services/logger.ts
import winston from 'winston';
import { config } from '../config/index.js';

export const logger = winston.createLogger({
  level: config.app.isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
  ],
});

// src/services/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { QueryResult } from '../types/index.js';
import { logger } from './logger.js';

export class SupabaseService {
  private client: SupabaseClient;
  
  constructor() {
    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceKey
    );
  }
  
  async executeQuery(sqlQuery: string): Promise<QueryResult> {
    try {
      logger.info('Executing SQL query', { query: sqlQuery });
      
      // Execute raw SQL query using Supabase RPC or direct connection
      const { data, error } = await this.client.rpc('exec_sql', {
        query: sqlQuery
      });
      
      if (error) {
        logger.error('Supabase query error', { error, query: sqlQuery });
        return {
          success: false,
          error: error.message,
          query: sqlQuery
        };
      }
      
      logger.info('Query executed successfully', { rowCount: data?.length || 0 });
      
      return {
        success: true,
        data: data || [],
        query: sqlQuery
      };
    } catch (error) {
      logger.error('Unexpected error executing query', { error, query: sqlQuery });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        query: sqlQuery
      };
    }
  }
  
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client.from('_supabase_functions').select('*').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

// src/services/llm.ts
import OpenAI from 'openai';
import { config } from '../config/index.js';
import { DatabaseSchema } from '../types/index.js';
import { logger } from './logger.js';

export class LLMService {
  private openai: OpenAI;
  private dbSchema: DatabaseSchema | null = null;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  
  setDatabaseSchema(schema: DatabaseSchema): void {
    this.dbSchema = schema;
    logger.info('Database schema set', { tableCount: schema.tables.length });
  }
  
  async convertToSQL(userMessage: string): Promise<{ sql: string; explanation: string }> {
    if (!this.dbSchema) {
      throw new Error('Database schema not set');
    }
    
    const schemaDescription = this.formatSchemaForPrompt(this.dbSchema);
    
    const systemPrompt = `You are a SQL query generator for a Supabase PostgreSQL database.
    
Database Schema:
${schemaDescription}

Rules:
1. Generate only SELECT queries unless explicitly asked for data modification
2. Always use proper PostgreSQL syntax
3. Include appropriate JOINs when querying related tables
4. Limit results to 100 rows by default unless specified otherwise
5. Use lowercase for table and column names
6. Return the SQL query and a brief explanation of what it does
7. If the user request is unclear or cannot be converted to SQL, explain why`;

    const userPrompt = `Convert this natural language request to a SQL query: "${userMessage}"
    
Return your response in this JSON format:
{
  "sql": "the SQL query",
  "explanation": "brief explanation of what the query does",
  "readOnly": true/false (whether this is a read-only query)
}`;

    try {
      logger.debug('Requesting SQL conversion from LLM', { userMessage });
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 1000,
      });
      
      const response = JSON.parse(completion.choices[0].message.content || '{}');
      
      logger.info('LLM conversion successful', { 
        readOnly: response.readOnly,
        sqlLength: response.sql?.length 
      });
      
      return {
        sql: response.sql || '',
        explanation: response.explanation || 'No explanation provided',
      };
    } catch (error) {
      logger.error('LLM conversion error', { error, userMessage });
      throw new Error('Failed to convert message to SQL');
    }
  }
  
  private formatSchemaForPrompt(schema: DatabaseSchema): string {
    return schema.tables.map(table => {
      const columns = table.columns.map(col => {
        let colDef = `  - ${col.name} (${col.type}`;
        if (col.primaryKey) colDef += ', PRIMARY KEY';
        if (col.foreignKey) colDef += `, FK -> ${col.foreignKey.table}.${col.foreignKey.column}`;
        if (col.nullable) colDef += ', NULLABLE';
        colDef += ')';
        return colDef;
      }).join('\n');
      
      const relationships = table.relationships?.map(rel => {
        return `  - ${rel.type}: ${rel.table} via ${rel.column} -> ${rel.foreignColumn}`;
      }).join('\n') || '';
      
      return `Table: ${table.name}
Columns:
${columns}${relationships ? '\nRelationships:\n' + relationships : ''}`;
    }).join('\n\n');
  }
  
  async formatQueryResults(data: any[], query: string, explanation: string): Promise<string> {
    const systemPrompt = `Format SQL query results for a Telegram message. Keep it concise and readable.`;
    
    const userPrompt = `Format these results for a user:
Query explanation: ${explanation}
Number of results: ${data.length}
Sample data (first 5 rows): ${JSON.stringify(data.slice(0, 5), null, 2)}

Create a user-friendly message that summarizes the results. Use markdown formatting.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });
      
      return completion.choices[0].message.content || 'Results formatted successfully.';
    } catch (error) {
      logger.error('Error formatting results', { error });
      return `Query executed successfully. Found ${data.length} results.`;
    }
  }
}

// src/services/telegram.ts
import { Telegraf, Context } from 'telegraf';
import { config } from '../config/index.js';
import { SupabaseService } from './supabase.js';
import { LLMService } from './llm.js';
import { DatabaseSchema, UserSession } from '../types/index.js';
import { logger } from './logger.js';

export class TelegramBot {
  private bot: Telegraf;
  private supabase: SupabaseService;
  private llm: LLMService;
  private sessions: Map<number, UserSession> = new Map();
  
  constructor(supabase: SupabaseService, llm: LLMService) {
    this.bot = new Telegraf(config.telegram.token);
    this.supabase = supabase;
    this.llm = llm;
    
    this.setupHandlers();
  }
  
  private setupHandlers(): void {
    // Middleware to check authorization
    this.bot.use(async (ctx, next) => {
      if (!ctx.from) return;
      
      const userId = ctx.from.id;
      
      // Check if user is allowed (if allowlist is configured)
      if (config.telegram.allowedUserIds.length > 0 && 
          !config.telegram.allowedUserIds.includes(userId)) {
        await ctx.reply('⚠️ You are not authorized to use this bot.');
        return;
      }
      
      // Initialize or update session
      if (!this.sessions.has(userId)) {
        this.sessions.set(userId, {
          userId,
          username: ctx.from.username,
          queryCount: 0,
        });
      }
      
      await next();
    });
    
    // Start command
    this.bot.command('start', async (ctx) => {
      await ctx.reply(
        `🤖 Welcome to the AI Database Assistant!\n\n` +
        `I can help you query your database using natural language.\n\n` +
        `Simply send me a message like:\n` +
        `• "Show me all users registered this month"\n` +
        `• "What's the total revenue for Q4?"\n` +
        `• "List top 10 products by sales"\n\n` +
        `Commands:\n` +
        `/help - Show this message\n` +
        `/stats - Show your usage statistics\n` +
        `/schema - Show database structure`,
        { parse_mode: 'Markdown' }
      );
    });
    
    // Help command
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        `📖 *How to use this bot:*\n\n` +
        `Just send me a natural language query about your data!\n\n` +
        `*Examples:*\n` +
        `• "Show me all active users"\n` +
        `• "Count orders from last week"\n` +
        `• "Find customers with highest lifetime value"\n\n` +
        `*Tips:*\n` +
        `• Be specific about what data you want\n` +
        `• Mention time ranges when relevant\n` +
        `• Ask for aggregations (sum, count, average)\n` +
        `• Request sorting and limits`,
        { parse_mode: 'Markdown' }
      );
    });
    
    // Stats command
    this.bot.command('stats', async (ctx) => {
      const session = this.sessions.get(ctx.from!.id);
      if (session) {
        await ctx.reply(
          `📊 *Your Statistics:*\n\n` +
          `Queries executed: ${session.queryCount}\n` +
          `User ID: ${session.userId}\n` +
          `Username: @${session.username || 'N/A'}`,
          { parse_mode: 'Markdown' }
        );
      }
    });
    
    // Schema command
    this.bot.command('schema', async (ctx) => {
      await ctx.reply(
        `📋 *Database Schema:*\n\n` +
        `To see the database structure, please provide your schema using the /setschema command.\n\n` +
        `The bot needs to know your table structure to generate accurate queries.`,
        { parse_mode: 'Markdown' }
      );
    });
    
    // Handle text messages (natural language queries)
    this.bot.on('text', async (ctx) => {
      const userMessage = ctx.message.text;
      const userId = ctx.from.id;
      const session = this.sessions.get(userId)!;
      
      logger.info('Received query from user', { userId, username: session.username, message: userMessage });
      
      try {
        // Send typing indicator
        await ctx.sendChatAction('typing');
        
        // Convert to SQL using LLM
        const { sql, explanation } = await this.llm.convertToSQL(userMessage);
        
        if (!sql) {
          await ctx.reply(
            `❌ I couldn't convert your request to a valid SQL query.\n\n` +
            `*Reason:* ${explanation}`,
            { parse_mode: 'Markdown' }
          );
          return;
        }
        
        // Show the generated SQL (in development mode)
        if (config.app.isDevelopment) {
          await ctx.reply(
            `🔍 *Generated SQL:*\n\`\`\`sql\n${sql}\n\`\`\`\n\n*Explanation:* ${explanation}`,
            { parse_mode: 'Markdown' }
          );
        }
        
        // Execute the query
        await ctx.sendChatAction('typing');
        const result = await this.supabase.executeQuery(sql);
        
        // Update session
        session.lastQuery = sql;
        session.queryCount++;
        
        if (!result.success) {
          await ctx.reply(
            `❌ *Query failed:*\n\n${result.error}\n\n` +
            `*Query:* \`${sql}\``,
            { parse_mode: 'Markdown' }
          );
          return;
        }
        
        // Format and send results
        const formattedResults = await this.llm.formatQueryResults(
          result.data || [],
          sql,
          explanation
        );
        
        await ctx.reply(formattedResults, { parse_mode: 'Markdown' });
        
      } catch (error) {
        logger.error('Error processing message', { error, userId, message: userMessage });
        
        await ctx.reply(
          `❌ *An error occurred:*\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
          `Please try rephrasing your query or contact support if the issue persists.`,
          { parse_mode: 'Markdown' }
        );
      }
    });
    
    // Error handling
    this.bot.catch((err, ctx) => {
      logger.error('Bot error', { error: err, userId: ctx.from?.id });
      ctx.reply('❌ An unexpected error occurred. Please try again later.');
    });
  }
  
  async start(): Promise<void> {
    // Test Supabase connection
    const isConnected = await this.supabase.testConnection();
    if (!isConnected) {
      logger.warn('Could not verify Supabase connection. Some features may not work.');
    } else {
      logger.info('Supabase connection verified');
    }
    
    // Launch bot
    await this.bot.launch();
    logger.info('Telegram bot started successfully');
    
    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

// src/schemas/example-schema.ts
import { DatabaseSchema } from '../types/index.js';

// Example schema - Replace this with your actual database structure
export const exampleSchema: DatabaseSchema = {
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'email', type: 'text' },
        { name: 'full_name', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp' },
        { name: 'subscription_tier', type: 'text', nullable: true },
        { name: 'is_active', type: 'boolean' }
      ],
      relationships: [
        { type: 'one-to-many', table: 'orders', column: 'id', foreignColumn: 'user_id' },
        { type: 'one-to-many', table: 'sessions', column: 'id', foreignColumn: 'user_id' }
      ]
    },
    {
      name: 'products',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'name', type: 'text' },
        { name: 'description', type: 'text', nullable: true },
        { name: 'price', type: 'decimal' },
        { name: 'category', type: 'text' },
        { name: 'stock_quantity', type: 'integer' },
        { name: 'created_at', type: 'timestamp' }
      ],
      relationships: [
        { type: 'one-to-many', table: 'order_items', column: 'id', foreignColumn: 'product_id' }
      ]
    },
    {
      name: 'orders',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'user_id', type: 'uuid', foreignKey: { table: 'users', column: 'id' } },
        { name: 'status', type: 'text' },
        { name: 'total_amount', type: 'decimal' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'completed_at', type: 'timestamp', nullable: true }
      ],
      relationships: [
        { type: 'many-to-one', table: 'users', column: 'user_id', foreignColumn: 'id' },
        { type: 'one-to-many', table: 'order_items', column: 'id', foreignColumn: 'order_id' }
      ]
    },
    {
      name: 'order_items',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'order_id', type: 'uuid', foreignKey: { table: 'orders', column: 'id' } },
        { name: 'product_id', type: 'uuid', foreignKey: { table: 'products', column: 'id' } },
        { name: 'quantity', type: 'integer' },
        { name: 'unit_price', type: 'decimal' },
        { name: 'subtotal', type: 'decimal' }
      ],
      relationships: [
        { type: 'many-to-one', table: 'orders', column: 'order_id', foreignColumn: 'id' },
        { type: 'many-to-one', table: 'products', column: 'product_id', foreignColumn: 'id' }
      ]
    }
  ]
};

// src/index.ts
import { SupabaseService } from './services/supabase.js';
import { LLMService } from './services/llm.js';
import { TelegramBot } from './services/telegram.js';
import { logger } from './services/logger.js';
import { exampleSchema } from './schemas/example-schema.js';

async function main() {
  try {
    logger.info('Starting Telegram Supabase AI Bot...');
    
    // Initialize services
    const supabaseService = new SupabaseService();
    const llmService = new LLMService();
    
    // Set your database schema here
    // TODO: Replace exampleSchema with your actual database structure
    llmService.setDatabaseSchema(exampleSchema);
    
    // Initialize and start bot
    const bot = new TelegramBot(supabaseService, llmService);
    await bot.start();
    
    logger.info('Bot is running! Press Ctrl+C to stop.');
  } catch (error) {
    logger.error('Failed to start bot', { error });
    process.exit(1);
  }
}

// Run the bot
main();

// README.md
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