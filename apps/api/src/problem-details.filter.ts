import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
type HttpResponse = { status(code: number): HttpResponse; type(value: string): HttpResponse; send(value: unknown): void };

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const request = host.switchToHttp().getRequest<{ url: string }>();
    const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const detail = error instanceof Error ? error.message : 'Unexpected server error';
    response.status(status).type('application/problem+json').send({ type: `https://releasecanvas.app/problems/${status}`, title: status >= 500 ? 'Internal server error' : 'Request failed', status, detail, instance: request.url });
  }
}
