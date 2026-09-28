export interface AppConfig {
  environment: string;
  databaseUrl: string | undefined;
  azurePostgresHost: string | undefined;
  azurePostgresDatabase: string | undefined;
  azurePostgresUser: string | undefined;
  azureStorageAccount: string | undefined;
  azureWebJobsStorage: string | undefined;
  jwtSecret: string | undefined;
  jwtIssuer: string;
  jwtAudience: string;
}

export function requireSetting(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadConfig(): AppConfig {
  return {
    environment: process.env.AZURE_FUNCTIONS_ENVIRONMENT ?? 'Production',
    databaseUrl: process.env.DATABASE_URL,
    azurePostgresHost: process.env.AZURE_POSTGRES_HOST,
    azurePostgresDatabase: process.env.AZURE_POSTGRES_DATABASE,
    azurePostgresUser: process.env.AZURE_POSTGRES_USER,
    azureStorageAccount: process.env.AZURE_STORAGE_ACCOUNT,
    azureWebJobsStorage: process.env.AzureWebJobsStorage,
    jwtSecret: process.env.JWT_SECRET,
    jwtIssuer: process.env.JWT_ISSUER ?? 'schedule-planner',
    jwtAudience: process.env.JWT_AUDIENCE ?? 'schedule-planner-web',
  };
}