import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  data: null;
  error: {
    message: string;
    code: string;
  };
  meta: null;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message: string;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as { message: unknown }).message;
      message = Array.isArray(msg) ? msg.join(', ') : String(msg);
    } else {
      message = exception.message;
    }

    const code = HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR';

    const body: ErrorResponse = {
      data: null,
      error: {
        message,
        code,
      },
      meta: null,
    };

    // 요청 정보 로깅 (개발 환경 디버깅용)
    void request;

    response.status(status).json(body);
  }
}
