import { app } from '@azure/functions';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { logger } from '../logger.js';

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: withHttpHandler(false, async (_request, _context, services) => {
    const [database, blob] = await Promise.all([
      services.database.healthCheck().catch(() => false),
      services.blob.healthCheck().catch(() => false),
    ]);
    const healthyCount = Number(database) + Number(blob);
    const status = healthyCount === 2 ? 'healthy' : healthyCount === 1 ? 'degraded' : 'unhealthy';
    const statusCode = status === 'unhealthy' ? 503 : 200;
    logger.info({ database, blob, status }, 'Health check completed');
    return { status: statusCode, jsonBody: { status, services: { database, blob } } };
  }),
});