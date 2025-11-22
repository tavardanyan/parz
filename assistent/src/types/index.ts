export interface DatabaseSchema {
  tables: TableSchema[];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  relationships?: RelationshipSchema[];
  compositePrimaryKey?: string[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  foreignKey?: ForeignKeySchema;
  unique?: boolean;
  identity?: boolean;
  defaultValue?: string;
}

export interface ForeignKeySchema {
  table: string;
  column: string;
}

export interface RelationshipSchema {
  type: 'one-to-many' | 'many-to-one' | 'one-to-one' | 'many-to-many';
  table: string;
  column: string;
  foreignColumn: string;
  through?: string; // For many-to-many relationships through junction tables
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