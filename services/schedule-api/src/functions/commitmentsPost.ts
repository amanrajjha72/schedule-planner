import { randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import { commitmentSchema } from '../../../shared/schemas/validation.js';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { validateBody } from '../middleware/validateRequest.js';
import { logger } from '../logger.js';
import type { CommitmentRecord } from '../utils/records.js';
import { publicCommitment } from '../utils/records.js';

app.http('commitmentsPost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'commitments',
  handler: withHttpHandler(true, async (request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const input = await validateBody(request, commitmentSchema);
    const commitment: CommitmentRecord = { id: randomUUID(), userId: user.id, ...input };
    const created = await services.database.create<CommitmentRecord>('commitments', commitment);
    logger.info({ userId: user.id, commitmentId: created.id }, 'Commitment created');
    return { status: 201, jsonBody: { commitment: publicCommitment(created) } };
  }),
});