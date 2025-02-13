import { Injectable } from '@nestjs/common';
import { ZodError, ZodType } from 'zod';
import { ErrorHandlerService } from './error-handler.service';

@Injectable()
export class ValidationService {
  constructor(private errHandler: ErrorHandlerService) {}
  validate<T>(zodType: ZodType<T>, data: T): T {
    try {
      return zodType.parse(data);
    } catch (error: any) {
      if (error instanceof ZodError) {
        // Log or handle ZodError here
        this.errHandler.throwBadRequestError(
          error,
          `${error.errors[0].message}`,
        );
      } else {
        // throw other error
        this.errHandler.throwBadRequestError(error, `${error.status}`);
      }
    }
  }
}
