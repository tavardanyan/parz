import type { DatabaseSchema } from '../types/index.ts';

// Your actual database structure
export const schema: DatabaseSchema = {
  tables: [
    {
      name: 'images',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
        { name: 'slug', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp', defaultValue: 'now()' },
        { name: 'url', type: 'text', nullable: true }
      ],
      relationships: [
        { type: 'one-to-many', table: 'categories', column: 'id', foreignColumn: 'image_id' },
        { type: 'one-to-many', table: 'products', column: 'id', foreignColumn: 'imageId' },
        { type: 'one-to-many', table: 'ingredients', column: 'id', foreignColumn: 'imageId' }
      ]
    },
    {
      name: 'categories',
      columns: [
        { name: 'id', type: 'bigint', primaryKey: true, identity: true },
        { name: 'name', type: 'text', nullable: true },
        { name: 'slug', type: 'text', unique: true },
        { name: 'parent_id', type: 'bigint', nullable: true, foreignKey: { table: 'categories', column: 'id' } },
        { name: 'created_at', type: 'timestamp', defaultValue: 'now()' },
        { name: 'image_id', type: 'uuid', nullable: true, foreignKey: { table: 'images', column: 'id' } }
      ],
      relationships: [
        { type: 'many-to-one', table: 'categories', column: 'parent_id', foreignColumn: 'id' },
        { type: 'one-to-many', table: 'categories', column: 'id', foreignColumn: 'parent_id' },
        { type: 'many-to-one', table: 'images', column: 'image_id', foreignColumn: 'id' },
        { type: 'many-to-many', table: 'products', through: 'categories_products', column: 'id', foreignColumn: 'categoryId' }
      ]
    },
    {
      name: 'products',
      columns: [
        { name: 'id', type: 'bigint', primaryKey: true, identity: true },
        { name: 'name', type: 'text' },
        { name: 'imageId', type: 'uuid', nullable: true, foreignKey: { table: 'images', column: 'id' } },
        { name: 'price', type: 'real' },
        { name: 'desc', type: 'text', nullable: true },
        { name: 'createdAt', type: 'timestamp', defaultValue: 'now()' },
        { name: 'variants', type: 'jsonb', defaultValue: "'[]'::jsonb" }
      ],
      relationships: [
        { type: 'many-to-one', table: 'images', column: 'imageId', foreignColumn: 'id' },
        { type: 'many-to-many', table: 'categories', through: 'categories_products', column: 'id', foreignColumn: 'productId' }
      ]
    },
    {
      name: 'categories_products',
      columns: [
        { name: 'categoryId', type: 'bigint', foreignKey: { table: 'categories', column: 'id' } },
        { name: 'productId', type: 'bigint', foreignKey: { table: 'products', column: 'id' } }
      ],
      relationships: [
        { type: 'many-to-one', table: 'categories', column: 'categoryId', foreignColumn: 'id' },
        { type: 'many-to-one', table: 'products', column: 'productId', foreignColumn: 'id' }
      ],
      compositePrimaryKey: ['categoryId', 'productId']
    },
    {
      name: 'ingredients',
      columns: [
        { name: 'id', type: 'bigint', primaryKey: true, identity: true },
        { name: 'name', type: 'text' },
        { name: 'imageId', type: 'uuid', nullable: true, foreignKey: { table: 'images', column: 'id' } },
        { name: 'type', type: 'ingredient_type', defaultValue: "'flavor'::ingredient_type" }
      ],
      relationships: [
        { type: 'many-to-one', table: 'images', column: 'imageId', foreignColumn: 'id' }
      ]
    },
    {
      name: 'people',
      columns: [
        { name: 'height_cm', type: 'numeric', nullable: true },
        { name: 'height_in', type: 'numeric', nullable: true, defaultValue: '(height_cm / 2.54)' }
      ],
      relationships: []
    }
  ]
};