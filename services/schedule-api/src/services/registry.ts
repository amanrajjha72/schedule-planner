import type { IAuthService } from './interfaces/IAuthService.js';
import type { IBlobClientProvider } from './interfaces/IBlobClientProvider.js';
import type { IDatabaseService } from './interfaces/IDatabaseService.js';
import { AzuriteBlobClientProvider, ManagedIdentityBlobClientProvider } from './blobClientProvider.js';
import { DatabaseAuthService } from './auth.js';
import { loadConfig, requireSetting } from './config.js';
import { createLocalPostgresPool, createManagedIdentityPostgresPool, PostgresDatabaseService } from './postgresDatabase.js';

export interface Services {
  auth: IAuthService;
  blob: IBlobClientProvider;
  database: IDatabaseService;
}

let services: Services | null = null;

export function registerServices(registry: Services): void {
  services = registry;
}

export function clearServices(): void {
  services = null;
}

export function getServices(): Services {
  if (!services) services = initializeServices();
  return services;
}

function initializeServices(): Services {
  const config = loadConfig();
  const database = config.environment === 'Development'
    ? new PostgresDatabaseService(createLocalPostgresPool(requireSetting('DATABASE_URL')))
    : new PostgresDatabaseService(createManagedIdentityPostgresPool(
      requireSetting('AZURE_POSTGRES_HOST'),
      requireSetting('AZURE_POSTGRES_DATABASE'),
      requireSetting('AZURE_POSTGRES_USER'),
    ));
  const auth = new DatabaseAuthService(database, config);
  let blob: IBlobClientProvider;
  if (config.environment === 'Development') {
    blob = new AzuriteBlobClientProvider(requireSetting('AzureWebJobsStorage'));
  } else {
    const account = requireSetting('AZURE_STORAGE_ACCOUNT');
    if (!/^[a-z0-9]{3,24}$/.test(account)) throw new Error('AZURE_STORAGE_ACCOUNT is invalid');
    blob = new ManagedIdentityBlobClientProvider(account);
  }
  return { auth, blob, database };
}