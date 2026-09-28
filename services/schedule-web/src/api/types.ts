import type {
  Commitment,
  CreateAccountInput,
  CreateCommitmentInput,
  CreateGoalInput,
  Goal,
  HealthResponse,
  LoginInput,
  Schedule,
  Session,
  User,
} from '@schedule/shared';

export type {
  Commitment,
  CreateAccountInput,
  CreateCommitmentInput,
  CreateGoalInput,
  DayName,
  Goal,
  Priority,
  Schedule,
  Session,
  User,
} from '@schedule/shared';
export type Credentials = Pick<LoginInput, 'email' | 'password'>;
export type HealthStatus = HealthResponse;

export interface ApiClient {
  health(): Promise<HealthStatus>;
  getCurrentSchedule(): Promise<Schedule | null>;
  saveCurrentSchedule(weekOf: string, sessions: Session[]): Promise<Schedule>;
  generateSchedule(weekOf: string): Promise<{ sessions: Session[]; unscheduledGoals: string[] }>;
  listGoals(): Promise<Goal[]>;
  createGoal(input: CreateGoalInput): Promise<Goal>;
  updateGoal(goalId: string, input: Partial<CreateGoalInput>): Promise<Goal>;
  deleteGoal(goalId: string): Promise<{ deleted: true }>;
  listCommitments(): Promise<Commitment[]>;
  createCommitment(input: CreateCommitmentInput): Promise<Commitment>;
  updateCommitment(commitmentId: string, input: CreateCommitmentInput): Promise<Commitment>;
  deleteCommitment(commitmentId: string): Promise<{ deleted: true }>;
  createAccount(input: CreateAccountInput): Promise<User>;
  login(credentials: Credentials): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}