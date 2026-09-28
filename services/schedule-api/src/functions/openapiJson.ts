import { app } from '@azure/functions';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { openApiDocument } from '../openapi/spec.js';

app.http('openapiJson', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'openapi.json',
  handler: withHttpHandler(false, async () => ({ status: 200, jsonBody: openApiDocument })),
});