import { randomUUID } from 'node:crypto';
import type { Commitment, DayName, Goal, Session } from '../../../shared/types/entities.js';
import { AppError } from '../errors/AppError.js';

const days: DayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const priorityRank = { High: 0, Medium: 1, Low: 2 } as const;
const halfHourMinutes = 30;
const weekMinutes = 7 * 24 * 60;

export interface OwnedGoal extends Goal {
  userId: string;
}

export interface OwnedCommitment extends Commitment {
  userId: string;
}

export interface ScheduledSession extends Session {
  goalId?: string;
}

export interface GeneratedSchedule {
  sessions: ScheduledSession[];
  unscheduledGoals: string[];
}

export function generateWeeklySchedule(
  weekOf: string,
  goals: OwnedGoal[],
  commitments: OwnedCommitment[],
): GeneratedSchedule {
  const sortedGoals = [...goals].sort((left, right) =>
    priorityRank[left.priority] - priorityRank[right.priority] ||
    left.deadline.localeCompare(right.deadline) ||
    left.id.localeCompare(right.id),
  );
  const freeSlots = getFreeSlots(weekOf, commitments);
  const sessions: ScheduledSession[] = [];
  const unscheduledGoals: string[] = [];
  let nextSlotIndex = 0;
  let consecutiveWorkSlots = 0;
  let previousWorkEnd: number | null = null;

  for (const goal of sortedGoals) {
    const requestedSlots = Math.floor(goal.targetHours * 2 + Number.EPSILON);
    let scheduledSlots = 0;
    while (scheduledSlots < requestedSlots && nextSlotIndex < freeSlots.length) {
      const slot = freeSlots[nextSlotIndex++];
      if (previousWorkEnd !== slot.absoluteStart) consecutiveWorkSlots = 0;

      if (consecutiveWorkSlots >= 4) {
        sessions.push(createSession(slot, 'Break', undefined));
        consecutiveWorkSlots = 0;
        previousWorkEnd = slot.absoluteStart + halfHourMinutes;
        continue;
      }

      sessions.push(createSession(slot, goal.title, goal.id));
      scheduledSlots += 1;
      consecutiveWorkSlots += 1;
      previousWorkEnd = slot.absoluteStart + halfHourMinutes;
    }
    if (scheduledSlots < requestedSlots || goal.targetHours % 0.5 !== 0) {
      unscheduledGoals.push(goal.title);
    }
  }

  const nextSlot = freeSlots[nextSlotIndex];
  if (consecutiveWorkSlots >= 4 && nextSlot && previousWorkEnd === nextSlot.absoluteStart) {
    sessions.push(createSession(nextSlot, 'Break', undefined));
  }
  sessions.sort((left, right) => left.date.localeCompare(right.date) || left.startTime.localeCompare(right.startTime));
  return { sessions, unscheduledGoals };
}

export function validateManualSessions(
  weekOf: string,
  sessions: Session[],
  commitments: OwnedCommitment[],
): void {
  const weekStart = dateAtUtc(weekOf);
  const occupiedByDay = new Map<string, { start: number; end: number }[]>();

  for (const session of sessions) {
    const date = dateAtUtc(session.date);
    const dayOffset = Math.round((date.getTime() - weekStart.getTime()) / 86_400_000);
    const start = timeToMinutes(session.startTime);
    const end = timeToMinutes(session.endTime);
    if (dayOffset < 0 || dayOffset > 6 || days[(date.getUTCDay() + 6) % 7] !== session.day ||
      start < 7 * 60 || end > 23 * 60 || end <= start || start % halfHourMinutes !== 0 ||
      end % halfHourMinutes !== 0 || session.durationHours !== (end - start) / 60) {
      throw invalidSchedule('Sessions must match their date, stay within 07:00-23:00, and use 30-minute increments');
    }

    const sessionStart = dayOffset * 1440 + start;
    const sessionEnd = dayOffset * 1440 + end;
    if (isCommitmentOverlap(sessionStart, sessionEnd, commitments)) {
      throw invalidSchedule(`Session "${session.title}" overlaps a recurring commitment`);
    }
    const daySessions = occupiedByDay.get(session.date) ?? [];
    if (daySessions.some((range) => sessionStart < range.end && sessionEnd > range.start)) {
      throw invalidSchedule('Schedule sessions cannot overlap');
    }
    daySessions.push({ start: sessionStart, end: sessionEnd });
    occupiedByDay.set(session.date, daySessions);
  }
}

export function mondayOfUtcWeek(date: Date): string {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export function scheduledHoursByGoal(sessions: (Session & { goalId?: string })[]): Map<string, number> {
  const hours = new Map<string, number>();
  for (const session of sessions) {
    if (!session.goalId) continue;
    hours.set(session.goalId, (hours.get(session.goalId) ?? 0) + session.durationHours);
  }
  return hours;
}

function getFreeSlots(weekOf: string, commitments: OwnedCommitment[]): FreeSlot[] {
  const slots: FreeSlot[] = [];
  const weekStart = dateAtUtc(weekOf);
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + dayOffset);
    const dateString = date.toISOString().slice(0, 10);
    for (let minute = 7 * 60; minute < 23 * 60; minute += halfHourMinutes) {
      const absoluteStart = dayOffset * 1440 + minute;
      if (isCommitmentOverlap(absoluteStart, absoluteStart + halfHourMinutes, commitments)) continue;
      slots.push({
        absoluteStart,
        day: days[dayOffset],
        date: dateString,
        startMinute: minute,
      });
    }
  }
  return slots;
}

interface FreeSlot {
  absoluteStart: number;
  day: DayName;
  date: string;
  startMinute: number;
}

function createSession(slot: FreeSlot, title: string, goalId: string | undefined): ScheduledSession {
  const session: ScheduledSession = {
    id: randomUUID(),
    day: slot.day,
    date: slot.date,
    startTime: formatTime(slot.startMinute),
    endTime: formatTime(slot.startMinute + halfHourMinutes),
    title,
    durationHours: 0.5,
    status: 'Scheduled',
  };
  if (goalId) session.goalId = goalId;
  return session;
}

function isCommitmentOverlap(start: number, end: number, commitments: OwnedCommitment[]): boolean {
  return commitments.some((commitment) => commitment.days.some((day) => {
    const dayIndex = days.indexOf(day);
    const commitmentStart = dayIndex * 1440 + timeToMinutes(commitment.startTime);
    let commitmentEnd = dayIndex * 1440 + timeToMinutes(commitment.endTime);
    if (commitmentEnd <= commitmentStart) commitmentEnd += 1440;
    for (const offset of [-weekMinutes, 0, weekMinutes]) {
      if (start < commitmentEnd + offset && end > commitmentStart + offset) return true;
    }
    return false;
  }));
}

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function formatTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function dateAtUtc(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function invalidSchedule(message: string): Error {
  return new AppError(422, 'VALIDATION_ERROR', message);
}