import { app } from '@azure/functions';
import { weekOfSchema } from '../../../shared/schemas/validation.js';
import { AppError } from '../errors/AppError.js';
import { withHttpHandler } from '../middleware/withHttpHandler.js';
import { validateBody } from '../middleware/validateRequest.js';
import { generateWeeklySchedule, type OwnedCommitment, type OwnedGoal } from '../scheduler/rulesEngine.js';
import { persistSchedule, publicSessions } from '../utils/schedule.js';

app.http('scheduleGenerate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'schedule/generate',
  handler: withHttpHandler(true, async (request, _context, services, user) => {
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const { weekOf } = await validateBody(request, weekOfSchema);
    const [goals, commitments] = await Promise.all([
      services.database.findAll<OwnedGoal>('goals', { filter: { userId: user.id } }),
      services.database.findAll<OwnedCommitment>('commitments', { filter: { userId: user.id } }),
    ]);
    const generated = generateWeeklySchedule(weekOf, goals, commitments);
    await persistSchedule(services.database, user.id, weekOf, generated.sessions);
    return {
      status: 200,
      jsonBody: {
        sessions: publicSessions(generated.sessions),
        unscheduledGoals: generated.unscheduledGoals,
      },
    };
  }),
});