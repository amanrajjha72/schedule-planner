import { app } from '@azure/functions';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import type { CommitmentRecord } from '../utils/records.js';
import { publicCommitment } from '../utils/records.js';

app.http('commitmentsGet', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'commitments',
  handler: withHttpHandler(true, async (_request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const commitments = await services.database.findAll<CommitmentRecord>('commitments', {
      filter: { userId: user.id },
      orderBy: 'title',
    });
    return { status: 200, jsonBody: { commitments: commitments.map(publicCommitment) } };
  }),
});