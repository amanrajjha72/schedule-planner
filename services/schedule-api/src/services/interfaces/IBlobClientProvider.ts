export interface IBlobClientProvider {
  healthCheck(): Promise<boolean>;
}