import { app } from '@azure/functions';
import type { Session } from '../../../shared/types/entities.js';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { mondayOfUtcWeek } from '../scheduler/rulesEngine.js';
import type { ScheduleRecord } from '../utils/schedule.js';
import { publicSessions } from '../utils/schedule.js';

app.http('scheduleCurrentGet', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'schedule/current',
  handler: withHttpHandler(true, async (_request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const weekOf = mondayOfUtcWeek(new Date());
    const schedule = await services.database.findOne<ScheduleRecord>('schedules', { userId: user.id, weekOf });
    const sessions = (schedule?.sessions ?? []) as (Session & { goalId?: string })[];
    return { status: 200, jsonBody: { weekOf, sessions: publicSessions(sessions) } };
  }),
});