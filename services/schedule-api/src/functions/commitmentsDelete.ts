import { app } from '@azure/functions';
import { commitmentIdParamsSchema } from '../../../shared/schemas/validation.js';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { validateParams } from '../middleware/validateRequest.js';
import { logger } from '../logger.js';
import type { CommitmentRecord } from '../utils/records.js';

app.http('commitmentsDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'commitments/{commitmentId}',
  handler: withHttpHandler(true, async (request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const { commitmentId } = validateParams(request.params, commitmentIdParamsSchema);
    const existing = await services.database.findById<CommitmentRecord>('commitments', commitmentId);
    if (!existing || existing.userId !== user.id) throw new AppError(404, 'NOT_FOUND', 'Commitment not found');
    const deleted = await services.database.delete('commitments', commitmentId);
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Commitment not found');
    logger.info({ userId: user.id, commitmentId }, 'Commitment deleted');
    return { status: 200, jsonBody: { deleted: true } };
  }),
});