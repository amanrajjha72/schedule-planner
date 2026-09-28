import { app } from '@azure/functions';
import { loginSchema } from '../../../shared/schemas/validation.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { validateBody } from '../middleware/validateRequest.js';

app.http('authLogin', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: withHttpHandler(false, async (request, _context, services) => {
    const input = await validateBody(request, loginSchema);
    const result = await services.auth.login(input);
    return { status: 200, jsonBody: result };
  }),
});