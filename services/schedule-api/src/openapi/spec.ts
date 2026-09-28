const bearer = [{ bearerAuth: [] }];
const operation = (summary: string, secured = true) => ({
  summary,
  ...(secured ? { security: bearer } : {}),
  responses: { '200': { description: 'Successful response' }, '401': { description: 'Authentication required' }, '422': { description: 'Validation error' } },
});

export const openApiDocument = {
  openapi: '3.0.3',
  info: { title: 'Schedule Planner API', version: '1.0.0' },
  servers: [{ url: '/api' }],
  paths: {
    '/health': { get: operation('Check essential service health', false) },
    '/schedule/current': {
      get: operation('Get the current user schedule'),
      put: { ...operation('Save manually edited sessions'), requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SaveScheduleRequest' } } } } },
    },
    '/schedule/generate': { post: { ...operation('Generate and persist a conflict-free weekly schedule'), requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WeekRequest' } } } } } },
    '/goals': {
      get: operation('List the current user goals'),
      post: { ...operation('Create a goal'), requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GoalRequest' } } } } },
    },
    '/goals/{goalId}': {
      patch: { ...operation('Update an owned goal'), parameters: [{ in: 'path', name: 'goalId', required: true, schema: { type: 'string', format: 'uuid' } }] },
      delete: { ...operation('Delete an owned goal'), parameters: [{ in: 'path', name: 'goalId', required: true, schema: { type: 'string', format: 'uuid' } }] },
    },
    '/commitments': {
      get: operation('List the current user recurring commitments'),
      post: { ...operation('Create a recurring commitment'), requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CommitmentRequest' } } } } },
    },
    '/commitments/{commitmentId}': {
      put: { ...operation('Replace an owned recurring commitment'), parameters: [{ in: 'path', name: 'commitmentId', required: true, schema: { type: 'string', format: 'uuid' } }] },
      delete: { ...operation('Delete an owned recurring commitment'), parameters: [{ in: 'path', name: 'commitmentId', required: true, schema: { type: 'string', format: 'uuid' } }] },
    },
    '/auth/register': {
      post: { ...operation('Create an account', false), requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } } },
    },
    '/auth/login': {
      post: { ...operation('Sign in', false), requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } } },
    },
    '/auth/me': { get: operation('Get the authenticated account') },
    '/openapi.json': { get: operation('Retrieve this OpenAPI JSON document', false) },
    '/openapi.yaml': { get: operation('Retrieve the OpenAPI YAML document', false) },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      WeekRequest: { type: 'object', required: ['weekOf'], properties: { weekOf: { type: 'string', format: 'date', description: 'Monday in ISO YYYY-MM-DD form' } } },
      SaveScheduleRequest: { type: 'object', required: ['weekOf', 'sessions'], properties: { weekOf: { type: 'string', format: 'date' }, sessions: { type: 'array', items: { $ref: '#/components/schemas/Session' } } } },
      Session: { type: 'object', required: ['id', 'day', 'date', 'startTime', 'endTime', 'title', 'durationHours', 'status'], properties: { id: { type: 'string', format: 'uuid' }, day: { type: 'string' }, date: { type: 'string', format: 'date' }, startTime: { type: 'string', example: '09:00' }, endTime: { type: 'string', example: '09:30' }, title: { type: 'string' }, durationHours: { type: 'number' }, status: { type: 'string', enum: ['Scheduled', 'Needs review'] } } },
      GoalRequest: { type: 'object', required: ['title', 'deadline', 'priority', 'targetHours'], properties: { title: { type: 'string' }, description: { type: 'string' }, deadline: { type: 'string', format: 'date' }, priority: { type: 'string', enum: ['High', 'Medium', 'Low'] }, targetHours: { type: 'number', multipleOf: 0.5 } } },
      CommitmentRequest: { type: 'object', required: ['title', 'days', 'startTime', 'endTime', 'protected', 'type'], properties: { title: { type: 'string' }, days: { type: 'array', items: { type: 'string' } }, startTime: { type: 'string' }, endTime: { type: 'string' }, protected: { type: 'boolean' }, type: { type: 'string', enum: ['Fixed', 'Protected', 'Personal'] } } },
      RegisterRequest: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 12 } } },
      LoginRequest: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } },
    },
  },
};

export const openApiYaml = `openapi: 3.0.3
info:
  title: Schedule Planner API
  version: 1.0.0
servers:
  - url: /api
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []
paths:
  /health:
    get:
      security: []
      responses:
        '200': { description: Essential services healthy or degraded }
        '503': { description: Essential services unavailable }
  /schedule/current:
    get:
      responses:
        '200': { description: Current user's schedule }
    put:
      responses:
        '200': { description: Schedule saved }
        '422': { description: Invalid or conflicting sessions }
  /schedule/generate:
    post:
      responses:
        '200': { description: Generated sessions and unscheduled goal titles }
  /goals:
    get:
      responses:
        '200': { description: Current user's goals }
    post:
      responses:
        '201': { description: Goal created }
  /goals/{goalId}:
    patch:
      responses:
        '200': { description: Goal updated }
        '404': { description: Goal not found }
    delete:
      responses:
        '200': { description: Goal deleted }
        '404': { description: Goal not found }
  /commitments:
    get:
      responses:
        '200': { description: Current user's commitments }
    post:
      responses:
        '201': { description: Commitment created }
  /commitments/{commitmentId}:
    put:
      responses:
        '200': { description: Commitment updated }
    delete:
      responses:
        '200': { description: Commitment deleted }
  /auth/register:
    post:
      security: []
      responses:
        '201': { description: Account created; returns user and bearer token }
  /auth/login:
    post:
      security: []
      responses:
        '200': { description: Signed in; returns user and bearer token }
  /auth/me:
    get:
      responses:
        '200': { description: Authenticated user }
  /openapi.json:
    get:
      security: []
      responses:
        '200': { description: OpenAPI JSON document }
  /openapi.yaml:
    get:
      security: []
      responses:
        '200': { description: OpenAPI YAML document }
`;