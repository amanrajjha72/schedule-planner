import { app } from '@azure/functions';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { openApiYaml } from '../openapi/spec.js';

app.http('openapiYaml', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'openapi.yaml',
  handler: withHttpHandler(false, async () => ({
    status: 200,
    headers: { 'content-type': 'application/yaml; charset=utf-8' },
    body: openApiYaml,
  })),
});