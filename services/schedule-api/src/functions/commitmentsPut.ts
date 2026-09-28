import { app } from '@azure/functions';
import { commitmentIdParamsSchema, commitmentSchema } from '../../../shared/schemas/validation.js';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { validateBody, validateParams } from '../middleware/validateRequest.js';
import { logger } from '../logger.js';
import type { CommitmentRecord } from '../utils/records.js';
import { publicCommitment } from '../utils/records.js';

app.http('commitmentsPut', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'commitments/{commitmentId}',
  handler: withHttpHandler(true, async (request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const { commitmentId } = validateParams(request.params, commitmentIdParamsSchema);
    const input = await validateBody(request, commitmentSchema);
    const existing = await services.database.findById<CommitmentRecord>('commitments', commitmentId);
    if (!existing || existing.userId !== user.id) throw new AppError(404, 'NOT_FOUND', 'Commitment not found');
    const updated = await services.database.update<CommitmentRecord>('commitments', commitmentId, input);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Commitment not found');
    logger.info({ userId: user.id, commitmentId }, 'Commitment updated');
    return { status: 200, jsonBody: { commitment: publicCommitment(updated) } };
  }),
});