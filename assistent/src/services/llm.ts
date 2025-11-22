import OpenAI from 'openai';
import { config } from '../config/index.ts';
import type { DatabaseSchema } from '../types/index.ts';
import { logger } from './logger.ts';

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