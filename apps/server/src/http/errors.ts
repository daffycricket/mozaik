/**
 * Builds the standard error body returned by the REST API on validation failure.
 */
export function validationError(message: string): { error: { code: string; message: string } } {
  return { error: { code: 'VALIDATION_ERROR', message } };
}
