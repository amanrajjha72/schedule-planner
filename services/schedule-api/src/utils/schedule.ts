import { randomUUID } from 'node:crypto';
import type { Session } from '../../../shared/types/entities.js';
import type { IDatabaseService } from '../services/interfaces/IDatabaseService.js';
import type { OwnedGoal, ScheduledSession } from '../scheduler/rulesEngine.js';

export interface ScheduleRecord {
  id: string;
  userId: string;
  weekOf: string;
  sessions: ScheduledSession[];
  createdAt?: string;
  updatedAt?: string;
}

export function publicSessions(sessions: ScheduledSession[]): Session[] {
  return sessions.map(({ goalId: _goalId, ...session }) => session);
}

export function attachGoalIds(sessions: Session[], goals: OwnedGoal[]): ScheduledSession[] {
  const goalsByTitle = new Map<string, OwnedGoal[]>();
  for (const goal of goals) {
    const matches = goalsByTitle.get(goal.title) ?? [];
    matches.push(goal);
    goalsByTitle.set(goal.title, matches);
  }
  return sessions.map((session) => {
    const matches = goalsByTitle.get(session.title);
    return matches?.length === 1 ? { ...session, goalId: matches[0].id } : { ...session };
  });
}

export async function persistSchedule(
  database: IDatabaseService,
  userId: string,
  weekOf: string,
  sessions: ScheduledSession[],
): Promise<ScheduleRecord> {
  return database.transaction(async (trx) => {
    const existing = await trx.findOne<ScheduleRecord>('schedules', { userId, weekOf });
    if (existing) {
      const updated = await trx.update<ScheduleRecord>('schedules', existing.id, { sessions });
      if (!updated) throw new Error('Schedule disappeared during save');
      return updated;
    }
    return trx.create<ScheduleRecord>('schedules', {
      id: randomUUID(),
      userId,
      weekOf,
      sessions,
    });
  });
}