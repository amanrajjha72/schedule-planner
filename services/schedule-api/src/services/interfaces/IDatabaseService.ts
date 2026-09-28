export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filter?: Record<string, unknown>;
}

export interface IDatabaseService {
  findAll<T>(collection: string, options?: QueryOptions): Promise<T[]>;
  findById<T>(collection: string, id: string): Promise<T | null>;
  findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null>;
  create<T>(collection: string, data: T): Promise<T>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null>;
  delete(collection: string, id: string): Promise<boolean>;
  healthCheck(): Promise<boolean>;
  transaction<T>(fn: (trx: IDatabaseService) => Promise<T>): Promise<T>;
}