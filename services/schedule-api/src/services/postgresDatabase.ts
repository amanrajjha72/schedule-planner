import { DefaultAzureCredential } from '@azure/identity';
import { Pool, type PoolClient, type PoolConfig, type QueryResultRow } from 'pg';
import type { IDatabaseService, QueryOptions } from './interfaces/IDatabaseService.js';

type Collection = 'users' | 'goals' | 'commitments' | 'schedules';

const collectionTables: Record<Collection, string> = {
  users: 'users',
  goals: 'goals',
  commitments: 'commitments',
  schedules: 'schedules',
};

const collectionFields: Record<Collection, ReadonlySet<string>> = {
  users: new Set(['id', 'name', 'email', 'passwordHash', 'createdAt', 'updatedAt']),
  goals: new Set(['id', 'userId', 'title', 'description', 'deadline', 'priority', 'targetHours', 'scheduledHours', 'status', 'createdAt', 'updatedAt']),
  commitments: new Set(['id', 'userId', 'title', 'days', 'startTime', 'endTime', 'protected', 'type', 'createdAt', 'updatedAt']),
  schedules: new Set(['id', 'userId', 'weekOf', 'sessions', 'createdAt', 'updatedAt']),
};

export class PostgresDatabaseService implements IDatabaseService {
  private readonly pool: Pool | null;
  private readonly executor: QueryExecutor;

  constructor(pool: Pool) {
    this.pool = pool;
    this.executor = pool;
  }

  findAll<T>(collection: string, options: QueryOptions = {}): Promise<T[]> {
    return this.queryWith(async (executor) => {
      const table = tableFor(collection);
      const params: unknown[] = [];
      const where = whereClause(collection, options.filter ?? {}, params);
      const orderBy = options.orderBy ?? 'id';
      const orderColumn = columnFor(collection, orderBy);
      const direction = options.orderDirection === 'desc' ? 'DESC' : 'ASC';
      const limit = options.limit === undefined ? '' : ` LIMIT $${params.push(options.limit)}`;
      const offset = options.offset === undefined ? '' : ` OFFSET $${params.push(options.offset)}`;
      const result = await executor.query(
        `SELECT * FROM ${table}${where} ORDER BY ${orderColumn} ${direction}${limit}${offset}`,
        params,
      );
      return result.rows.map((row) => fromDatabaseRow<T>(row));
    });
  }

  findById<T>(collection: string, id: string): Promise<T | null> {
    return this.queryWith(async (executor) => {
      const result = await executor.query(`SELECT * FROM ${tableFor(collection)} WHERE id = $1 LIMIT 1`, [id]);
      return result.rows[0] ? fromDatabaseRow<T>(result.rows[0]) : null;
    });
  }

  findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null> {
    return this.queryWith(async (executor) => {
      const params: unknown[] = [];
      const where = whereClause(collection, filter, params);
      if (!where) throw new Error('findOne requires at least one filter');
      const result = await executor.query(`SELECT * FROM ${tableFor(collection)}${where} LIMIT 1`, params);
      return result.rows[0] ? fromDatabaseRow<T>(result.rows[0]) : null;
    });
  }

  create<T>(collection: string, data: T): Promise<T> {
    return this.queryWith(async (executor) => {
      const table = tableFor(collection);
      const entries = writableEntries(collection, data as Record<string, unknown>);
      if (!entries.length) throw new Error(`No writable fields for ${collection}`);
      const columns = entries.map(([field]) => columnFor(collection, field));
      const values = entries.map(([field, value]) => field === 'sessions' ? JSON.stringify(value) : value);
      const placeholders = values.map((_, index) => `$${index + 1}`);
      const result = await executor.query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
        values,
      );
      return fromDatabaseRow<T>(result.rows[0]);
    });
  }

  update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    return this.queryWith(async (executor) => {
      const entries = writableEntries(collection, data as Record<string, unknown>);
      if (!entries.length) {
        const current = await executor.query(`SELECT * FROM ${tableFor(collection)} WHERE id = $1 LIMIT 1`, [id]);
        return current.rows[0] ? fromDatabaseRow<T>(current.rows[0]) : null;
      }
      const assignments = entries.map(([field], index) => `${columnFor(collection, field)} = $${index + 1}`);
      const values = entries.map(([field, value]) => field === 'sessions' ? JSON.stringify(value) : value);
      if (collectionFields[asCollection(collection)].has('updatedAt')) assignments.push('updated_at = NOW()');
      values.push(id);
      const result = await executor.query(
        `UPDATE ${tableFor(collection)} SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values,
      );
      return result.rows[0] ? fromDatabaseRow<T>(result.rows[0]) : null;
    });
  }

  delete(collection: string, id: string): Promise<boolean> {
    return this.queryWith(async (executor) => {
      const result = await executor.query(`DELETE FROM ${tableFor(collection)} WHERE id = $1`, [id]);
      return (result.rowCount ?? 0) > 0;
    });
  }

  count(collection: string, filter: Record<string, unknown> = {}): Promise<number> {
    return this.queryWith(async (executor) => {
      const params: unknown[] = [];
      const where = whereClause(collection, filter, params);
      const result = await executor.query(`SELECT COUNT(*)::int AS count FROM ${tableFor(collection)}${where}`, params);
      return Number(result.rows[0]?.count ?? 0);
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.executor.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async transaction<T>(fn: (trx: IDatabaseService) => Promise<T>): Promise<T> {
    if (!this.pool) return fn(this);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(PostgresDatabaseService.forTransaction(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private async queryWith<T>(operation: (executor: QueryExecutor) => Promise<T>): Promise<T> {
    return operation(this.executor);
  }

  private static forTransaction(client: PoolClient): PostgresDatabaseService {
    const database = Object.create(PostgresDatabaseService.prototype) as PostgresDatabaseService;
    Object.defineProperties(database, {
      pool: { value: null },
      executor: { value: client },
    });
    return database;
  }
}

interface QueryExecutor {
  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
}

export function createLocalPostgresPool(connectionString: string): Pool {
  return new Pool({ connectionString, max: 10 });
}

export function createManagedIdentityPostgresPool(host: string, database: string, user: string): Pool {
  const credential = new DefaultAzureCredential();
  const poolConfig: PoolConfig = {
    host,
    database,
    user,
    port: 5432,
    max: 10,
    ssl: { rejectUnauthorized: true },
    password: async () => {
      const token = await credential.getToken('https://ossrdbms-aad.database.windows.net/.default');
      if (!token) throw new Error('Managed identity did not return a PostgreSQL access token');
      return token.token;
    },
  };
  return new Pool(poolConfig);
}

function tableFor(collection: string): string {
  return collectionTables[asCollection(collection)];
}

function asCollection(collection: string): Collection {
  if (collection in collectionTables) return collection as Collection;
  throw new Error(`Unsupported database collection: ${collection}`);
}

function columnFor(collection: string, field: string): string {
  const selected = asCollection(collection);
  if (!collectionFields[selected].has(field)) throw new Error(`Unsupported ${collection} field: ${field}`);
  return toSnake(field);
}

function whereClause(collection: string, filter: Record<string, unknown>, params: unknown[]): string {
  const conditions = Object.entries(filter).map(([field, value]) => {
    const column = columnFor(collection, field);
    params.push(value);
    return `${column} = $${params.length}`;
  });
  return conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
}

function writableEntries(collection: string, data: Record<string, unknown>): [string, unknown][] {
  const ignored = new Set(['id', 'createdAt', 'updatedAt']);
  return Object.entries(data).filter(([field, value]) => {
    columnFor(collection, field);
    return value !== undefined && !ignored.has(field);
  });
}

function toSnake(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function fromDatabaseRow<T>(row: QueryResultRow): T {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => {
    const normalizedValue = value instanceof Date
      ? key === 'deadline' || key === 'week_of'
        ? dateOnlyString(value)
        : value.toISOString()
      : value;
    return [toCamel(key), normalizedValue];
  })) as T;
}

function dateOnlyString(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

