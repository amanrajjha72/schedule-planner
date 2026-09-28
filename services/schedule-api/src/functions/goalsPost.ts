import { randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import { createGoalSchema } from '../../../shared/schemas/validation.js';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { validateBody } from '../middleware/validateRequest.js';
import { logger } from '../logger.js';
import type { GoalRecord } from '../utils/records.js';
import { publicGoal } from '../utils/records.js';

app.http('goalsPost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'goals',
  handler: withHttpHandler(true, async (request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const input = await validateBody(request, createGoalSchema);
    const goal: GoalRecord = {
      id: randomUUID(),
      userId: user.id,
      ...input,
      description: input.description ?? '',
      scheduledHours: 0,
      status: 'At risk',
    };
    const created = await services.database.create<GoalRecord>('goals', goal);
    logger.info({ userId: user.id, goalId: created.id }, 'Goal created');
    return { status: 201, jsonBody: { goal: publicGoal(created) } };
  }),
});