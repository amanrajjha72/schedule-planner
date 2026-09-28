export type Priority = 'High' | 'Medium' | 'Low';
export type GoalStatus = 'On track' | 'At risk';
export type SessionStatus = 'Scheduled' | 'Needs review';
export type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  id: string;
  day: DayName;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  durationHours: number;
  status: SessionStatus;
}

export interface Schedule {
  weekOf: string;
  sessions: Session[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: Priority;
  targetHours: number;
  scheduledHours: number;
  status: GoalStatus;
}

export interface Commitment {
  id: string;
  title: string;
  days: DayName[];
  startTime: string;
  endTime: string;
  protected: boolean;
  type: 'Fixed' | 'Protected' | 'Personal';
}

export interface UnscheduledGoal {
  goalId: string;
  title: string;
  remainingHours: number;
  reason: string;
}