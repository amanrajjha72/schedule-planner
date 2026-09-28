import { app } from '@azure/functions';
import type { Session } from '../../../shared/types/entities.js';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { mondayOfUtcWeek } from '../scheduler/rulesEngine.js';
import { scheduledHoursByGoal } from '../scheduler/rulesEngine.js';
import type { ScheduleRecord } from '../utils/schedule.js';
import { GoalRecord, publicGoal } from '../utils/records.js';

app.http('goalsGet', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'goals',
  handler: withHttpHandler(true, async (_request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const [goals, schedule] = await Promise.all([
      services.database.findAll<GoalRecord>('goals', { filter: { userId: user.id }, orderBy: 'deadline' }),
      services.database.findOne<ScheduleRecord>('schedules', {
        userId: user.id,
        weekOf: mondayOfUtcWeek(new Date()),
      }),
    ]);
    const sessions = (schedule?.sessions ?? []) as (Session & { goalId?: string })[];
    const scheduledHours = scheduledHoursByGoal(sessions);
    const result = goals.map((goal) => {
      const hours = scheduledHours.get(goal.id) ?? 0;
      return publicGoal({ ...goal, scheduledHours: hours, status: hours >= goal.targetHours ? 'On track' : 'At risk' });
    });
    return { status: 200, jsonBody: { goals: result } };
  }),
});