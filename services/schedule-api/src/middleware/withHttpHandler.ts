import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import type { User } from '../../../shared/types/entities.js';
import { handleError } from '../errors/errorHandler.js';
import { logger } from '../logger.js';
import { getServices, type Services } from '../services/registry.js';

export type HttpAction = (
  request: HttpRequest,
  context: InvocationContext,
  services: Services,
  user: User | null,
) => Promise<HttpResponseInit>;

export function withHttpHandler(requiresAuthentication: boolean, action: HttpAction) {
  return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startedAt = Date.now();
    let response: HttpResponseInit;
    try {
      const services = getServices();
      const user = requiresAuthentication
        ? await services.auth.authenticate(request.headers.get('authorization'))
        : null;
      response = await action(request, context, services, user);
    } catch (error) {
      response = handleError(error);
    }

    logger.info({
      invocationId: context.invocationId,
      method: request.method,
      path: new URL(request.url).pathname,
      statusCode: response.status ?? 200,
      durationMs: Date.now() - startedAt,
    }, 'HTTP request completed');
    return response;
  };
}