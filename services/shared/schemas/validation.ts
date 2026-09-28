import { z } from 'zod';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:mm time');
const dateSchema = z.string().date();
const daysSchema = z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).min(1);

const isMonday = (value: string) => new Date(`${value}T00:00:00.000Z`).getUTCDay() === 1;
export const weekOfSchema = z.object({ weekOf: dateSchema }).refine((input) => isMonday(input.weekOf), {
  message: 'weekOf must be a Monday',
  path: ['weekOf'],
});
export const sessionSchema = z.object({
  id: z.string().uuid(),
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  title: z.string().trim().min(1).max(200),
  durationHours: z.number().positive().max(24),
  status: z.enum(['Scheduled', 'Needs review']),
});
export const saveScheduleSchema = z.object({ weekOf: dateSchema, sessions: z.array(sessionSchema).max(500) })
  .refine((input) => isMonday(input.weekOf), { message: 'weekOf must be a Monday', path: ['weekOf'] });

export const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).default(''),
  deadline: dateSchema,
  priority: z.enum(['High', 'Medium', 'Low']),
  targetHours: z.number().positive().max(168).multipleOf(0.5, 'Use 30-minute increments'),
});
export const updateGoalSchema = createGoalSchema.partial().refine((input) => Object.keys(input).length > 0, 'At least one field is required');
export const goalIdParamsSchema = z.object({ goalId: z.string().uuid() });

export const commitmentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  days: daysSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  protected: z.boolean(),
  type: z.enum(['Fixed', 'Protected', 'Personal']),
}).refine((value) => value.startTime !== value.endTime, { message: 'Start and end times must differ', path: ['endTime'] });
export const commitmentIdParamsSchema = z.object({ commitmentId: z.string().uuid() });

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(128),
});
export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
});

export type SaveScheduleInput = z.infer<typeof saveScheduleSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateCommitmentInput = z.infer<typeof commitmentSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type LoginInput = z.infer<typeof loginSchema>;