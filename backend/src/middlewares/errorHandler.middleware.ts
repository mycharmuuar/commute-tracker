import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const message = err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';
  
  let statusCode = 500;
  if (message.startsWith('ZERO_RESULTS') || message.startsWith('NOT_FOUND')) {
    statusCode = 404;
  } else if (message.startsWith('INVALID_REQUEST')) {
    statusCode = 400;
  } else if (message.startsWith('OVER_QUERY_LIMIT')) {
    statusCode = 429;
  } else if (message.startsWith('REQUEST_DENIED')) {
    statusCode = 403;
  } else if (message.startsWith('TIMEOUT')) {
    statusCode = 504;
  }

  res.status(statusCode).json({
    success: false,
    error: err.name || 'API_ERROR',
    message: message.replace(/^[A-Z_]+:\s*/, ''),
    rawStatus: statusCode,
  });
}
