import type { Commitment, Goal, Schedule, Session, User } from './entities.js';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR';

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details: Record<string, unknown> | null;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, boolean>;
}

export interface CurrentScheduleResponse {
  weekOf: string;
  sessions: Session[];
}

export interface ScheduleResponse {
  schedule: Schedule;
}

export interface GenerateScheduleResponse {
  sessions: Session[];
  unscheduledGoals: string[];
}

export interface GoalsResponse {
  goals: Goal[];
}

export interface GoalResponse {
  goal: Goal;
}

export interface CommitmentsResponse {
  commitments: Commitment[];
}

export interface CommitmentResponse {
  commitment: Commitment;
}

export interface DeleteResponse {
  deleted: true;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CurrentUserResponse {
  user: User;
}