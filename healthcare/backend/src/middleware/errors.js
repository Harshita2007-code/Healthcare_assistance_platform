export class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export function notFound(_req, _res, next) {
  next(new HttpError(404, 'NOT_FOUND', 'Route not found.'));
}
export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON.' } });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' } });
  if (err.name === 'ZodError') {
    const issue = err.issues[0];
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: issue?.message || 'Invalid request.', field: issue?.path?.join('.') } });
  }
  if (err.code === 11000) return res.status(409).json({ error: { code: 'ACCOUNT_EXISTS', message: 'An account with this mobile number already exists.' } });
  if (err instanceof HttpError) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
}
