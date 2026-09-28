import { app } from '@azure/functions';
import { saveScheduleSchema } from '../../../shared/schemas/validation.js';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { validateBody } from '../middleware/validateRequest.js';
import { validateManualSessions, type OwnedCommitment, type OwnedGoal } from '../scheduler/rulesEngine.js';
import type { ScheduleRecord } from '../utils/schedule.js';
import { attachGoalIds, persistSchedule, publicSessions } from '../utils/schedule.js';

app.http('scheduleCurrentPut', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'schedule/current',
  handler: withHttpHandler(true, async (request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const input = await validateBody(request, saveScheduleSchema);
    const [commitments, goals] = await Promise.all([
      services.database.findAll<OwnedCommitment>('commitments', { filter: { userId: user.id } }),
      services.database.findAll<OwnedGoal>('goals', { filter: { userId: user.id } }),
    ]);
    validateManualSessions(input.weekOf, input.sessions, commitments);
    const sessions = attachGoalIds(input.sessions, goals);
    const schedule = await persistSchedule(services.database, user.id, input.weekOf, sessions);
    return {
      status: 200,
      jsonBody: {
        schedule: { weekOf: schedule.weekOf, sessions: publicSessions(schedule.sessions) },
      },
    };
  }),
});