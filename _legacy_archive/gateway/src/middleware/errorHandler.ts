// Global error handler — converts all errors to consistent JSON responses

import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function globalErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const { log } = request;

  // ─── Validation errors (Fastify schema) ────────────────────
  if (error.validation) {
    reply.status(422).send({
      error: 'ERR_VALIDATION',
      message: 'Request validation failed.',
      details: error.validation,
    });
    return;
  }

  // ─── Known HTTP errors ──────────────────────────────────────
  if (error.statusCode) {
    log.warn({ err: error }, 'HTTP error');
    reply.status(error.statusCode).send({
      error: error.code || 'ERR_HTTP',
      message: error.message,
    });
    return;
  }

  // ─── Unknown / unexpected errors ────────────────────────────
  log.error({ err: error }, 'Unhandled error');
  reply.status(500).send({
    error: 'ERR_INTERNAL',
    message: 'An internal server error occurred.',
  });
}
