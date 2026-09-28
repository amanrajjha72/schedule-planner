import type {
  AuthResponse,
  CommitmentResponse,
  CommitmentsResponse,
  CurrentScheduleResponse,
  CurrentUserResponse,
  DeleteResponse,
  ErrorResponse,
  GenerateScheduleResponse,
  GoalResponse,
  GoalsResponse,
  ScheduleResponse,
} from '@schedule/shared';
import type { ApiClient, Credentials } from './types';

const apiBase = (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/+$/, '');
const TOKEN_STORAGE_KEY = 'schedule-planner:token';

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage write failures in restricted browser contexts.
  }
}

let accessToken: string | null = readStoredToken();

class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${apiBase}${path}`, { ...init, headers });
  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const error = typeof payload === 'object' && payload !== null
      ? (payload as Partial<ErrorResponse>).error
      : undefined;
    throw new ApiError(response.status, error?.message ?? response.statusText);
  }
  return payload as T;
}

async function authenticate(path: '/auth/register' | '/auth/login', body: object) {
  const result = await request<AuthResponse>(path, { method: 'POST', body: JSON.stringify(body) });
  accessToken = result.token;
  persistToken(accessToken);
  return result.user;
}

export const liveClient: ApiClient = {
  health: () => request('/health'),
  async getCurrentSchedule() {
    return request<CurrentScheduleResponse>('/schedule/current');
  },
  async saveCurrentSchedule(weekOf, sessions) {
    const result = await request<ScheduleResponse>('/schedule/current', {
      method: 'PUT',
      body: JSON.stringify({ weekOf, sessions }),
    });
    return result.schedule;
  },
  generateSchedule: (weekOf) => request<GenerateScheduleResponse>('/schedule/generate', {
    method: 'POST',
    body: JSON.stringify({ weekOf }),
  }),
  async listGoals() {
    return (await request<GoalsResponse>('/goals')).goals;
  },
  async createGoal(input) {
    return (await request<GoalResponse>('/goals', {
      method: 'POST',
      body: JSON.stringify(input),
    })).goal;
  },
  async updateGoal(goalId, input) {
    return (await request<GoalResponse>(`/goals/${encodeURIComponent(goalId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })).goal;
  },
  deleteGoal: (goalId) => request<DeleteResponse>(`/goals/${encodeURIComponent(goalId)}`, { method: 'DELETE' }),
  async listCommitments() {
    return (await request<CommitmentsResponse>('/commitments')).commitments;
  },
  async createCommitment(input) {
    return (await request<CommitmentResponse>('/commitments', {
      method: 'POST',
      body: JSON.stringify(input),
    })).commitment;
  },
  async updateCommitment(commitmentId, input) {
    return (await request<CommitmentResponse>(`/commitments/${encodeURIComponent(commitmentId)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })).commitment;
  },
  deleteCommitment: (commitmentId) => request<DeleteResponse>(`/commitments/${encodeURIComponent(commitmentId)}`, { method: 'DELETE' }),
  createAccount: (input) => authenticate('/auth/register', input),
  login: (credentials: Credentials) => authenticate('/auth/login', credentials),
  async logout() {
    accessToken = null;
    persistToken(null);
  },
  async getCurrentUser() {
    if (!accessToken) return null;
    try {
      const user = (await request<CurrentUserResponse>('/auth/me')).user;
      return user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        accessToken = null;
        persistToken(null);
      }
      throw error;
    }
  },
};