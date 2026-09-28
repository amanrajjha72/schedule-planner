import { app } from '@azure/functions';
import { goalIdParamsSchema } from '../../../shared/schemas/validation.js';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { validateParams } from '../middleware/validateRequest.js';
import { logger } from '../logger.js';
import type { ScheduleRecord } from '../utils/schedule.js';
import type { GoalRecord } from '../utils/records.js';

app.http('goalsDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'goals/{goalId}',
  handler: withHttpHandler(true, async (request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const { goalId } = validateParams(request.params, goalIdParamsSchema);
    const goal = await services.database.findById<GoalRecord>('goals', goalId);
    if (!goal || goal.userId !== user.id) throw new AppError(404, 'NOT_FOUND', 'Goal not found');

    await services.database.transaction(async (trx) => {
      const schedules = await trx.findAll<ScheduleRecord>('schedules', { filter: { userId: user.id } });
      for (const schedule of schedules) {
        const sessions = schedule.sessions.filter((session) => session.goalId !== goalId);
        if (sessions.length !== schedule.sessions.length) {
          await trx.update<ScheduleRecord>('schedules', schedule.id, { sessions });
        }
      }
      const deleted = await trx.delete('goals', goalId);
      if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Goal not found');
    });

    logger.info({ userId: user.id, goalId }, 'Goal deleted');
    return { status: 200, jsonBody: { deleted: true } };
  }),
});