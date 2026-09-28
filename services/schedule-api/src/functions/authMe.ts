import { app } from '@azure/functions';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';

app.http('authMe', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: withHttpHandler(true, async (_request, _context, _services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    return { status: 200, jsonBody: { user } };
  }),
});