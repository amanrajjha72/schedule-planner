import { app } from '@azure/functions';
import { goalIdParamsSchema, updateGoalSchema } from '../../../shared/schemas/validation.js';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { validateBody, validateParams } from '../middleware/validateRequest.js';
import { logger } from '../logger.js';
import { mondayOfUtcWeek, scheduledHoursByGoal } from '../scheduler/rulesEngine.js';
import type { ScheduleRecord } from '../utils/schedule.js';
import type { GoalRecord } from '../utils/records.js';
import { publicGoal } from '../utils/records.js';

app.http('goalsPatch', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'goals/{goalId}',
  handler: withHttpHandler(true, async (request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const { goalId } = validateParams(request.params, goalIdParamsSchema);
    const input = await validateBody(request, updateGoalSchema);
    const current = await services.database.findById<GoalRecord>('goals', goalId);
    if (!current || current.userId !== user.id) throw new AppError(404, 'NOT_FOUND', 'Goal not found');

    const updated = await services.database.transaction(async (trx) => {
      const result = await trx.update<GoalRecord>('goals', goalId, input);
      if (!result) throw new AppError(404, 'NOT_FOUND', 'Goal not found');
      if (input.title && input.title !== current.title) {
        const schedules = await trx.findAll<ScheduleRecord>('schedules', { filter: { userId: user.id } });
        for (const schedule of schedules) {
          const sessions = schedule.sessions.map((session) => session.goalId === goalId
            ? { ...session, title: input.title as string }
            : session);
          if (sessions.some((session, index) => session.title !== schedule.sessions[index]?.title)) {
            await trx.update<ScheduleRecord>('schedules', schedule.id, { sessions });
          }
        }
      }
      return result;
    });

    const currentSchedule = await services.database.findOne<ScheduleRecord>('schedules', {
      userId: user.id,
      weekOf: mondayOfUtcWeek(new Date()),
    });
    const hours = scheduledHoursByGoal(currentSchedule?.sessions ?? []).get(goalId) ?? 0;
    const goal = publicGoal({
      ...updated,
      scheduledHours: hours,
      status: hours >= updated.targetHours ? 'On track' : 'At risk',
    });
    logger.info({ userId: user.id, goalId }, 'Goal updated');
    return { status: 200, jsonBody: { goal } };
  }),
});