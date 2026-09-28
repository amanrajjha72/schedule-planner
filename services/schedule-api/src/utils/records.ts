import type { Commitment, Goal } from '../../../shared/types/entities.js';

export interface GoalRecord extends Goal {
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommitmentRecord extends Commitment {
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export function publicGoal(goal: GoalRecord): Goal {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    deadline: goal.deadline,
    priority: goal.priority,
    targetHours: goal.targetHours,
    scheduledHours: goal.scheduledHours,
    status: goal.status,
  };
}

export function publicCommitment(commitment: CommitmentRecord): Commitment {
  return {
    id: commitment.id,
    title: commitment.title,
    days: commitment.days,
    startTime: commitment.startTime,
    endTime: commitment.endTime,
    protected: commitment.protected,
    type: commitment.type,
  };
}