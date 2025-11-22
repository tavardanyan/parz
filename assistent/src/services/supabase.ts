import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.ts';
import type { QueryResult } from '../types/index.ts';
import { logger } from './logger.ts';

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
        query: sqlQuery.replace(/;$/, '') // Remove trailing semicolon if present
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
      console.log('Supabase connection test data:', data);
      return !error;
    } catch(err) {
      console.error('Error testing Supabase connection', err);
      return false;
    }
  }
}