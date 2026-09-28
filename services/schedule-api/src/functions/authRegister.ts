import { app } from '@azure/functions';
import { createAccountSchema } from '../../../shared/schemas/validation.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { validateBody } from '../middleware/validateRequest.js';

app.http('authRegister', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: withHttpHandler(false, async (request, _context, services) => {
    const input = await validateBody(request, createAccountSchema);
    const result = await services.auth.createAccount(input);
    return { status: 201, jsonBody: result };
  }),
});