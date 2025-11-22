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