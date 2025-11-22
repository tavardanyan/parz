import { SupabaseService } from './services/supabase.ts';
import { LLMService } from './services/llm.ts';
import { TelegramBot } from './services/telegram.ts';
import { logger } from './services/logger.ts';
import { schema } from './schemas/example-schema.ts';

async function main() {
  try {
    logger.info('Starting Telegram Supabase AI Bot...');
    
    // Initialize services
    const supabaseService = new SupabaseService();
    const llmService = new LLMService();
    
    // Set your database schema here
    // TODO: Replace exampleSchema with your actual database structure
    llmService.setDatabaseSchema(schema);
    
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