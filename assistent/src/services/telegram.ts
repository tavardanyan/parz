import { Telegraf, Context } from 'telegraf';
import { config } from '../config/index.ts';
import { SupabaseService } from './supabase.ts';
import { LLMService } from './llm.ts';
import type { DatabaseSchema, UserSession } from '../types/index.ts';
import { logger } from './logger.ts';

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