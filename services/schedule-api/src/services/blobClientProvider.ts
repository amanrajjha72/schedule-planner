import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import type { IBlobClientProvider } from './interfaces/IBlobClientProvider.js';

export class AzuriteBlobClientProvider implements IBlobClientProvider {
  private readonly client: BlobServiceClient;

  constructor(connectionString: string) {
    this.client = BlobServiceClient.fromConnectionString(connectionString);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getAccountInfo();
      return true;
    } catch {
      return false;
    }
  }
}

export class ManagedIdentityBlobClientProvider implements IBlobClientProvider {
  private readonly client: BlobServiceClient;

  constructor(account: string) {
    this.client = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      new DefaultAzureCredential(),
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getAccountInfo();
      return true;
    } catch {
      return false;
    }
  }
}