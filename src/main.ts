import * as compression from 'compression';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as moment from 'moment-timezone';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { AllExceptionsFilter } from '@utils/all-exception-filter';
async function bootstrap() {
  // Initialize the NestJS application
  const app = await NestFactory.create(AppModule);
  const errorHandler = app.get(ErrorHandlerService); // Am
  // process.on('unhandledRejection', (reason, promise) => {
  //   try {
  //     errorHandler.logDebug(
  //       `Unhandled Rejection at: ${promise}, reason:, ${reason}`,
  //     );
  //   } catch (e) {}
  // });
  // Set default timezone
  moment.tz.setDefault('Asia/Makassar'); // Set default timezone to WIT
  // Enable CORS
  app.enableCors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow credentials (e.g., cookies, authorization headers)
  });

  // Set global prefix for routes
  app.setGlobalPrefix('api');

  // Enable validation pipe for incoming requests
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Enable compression middleware
  app.use(compression());
  app.useGlobalFilters(new AllExceptionsFilter());
  // Initialize any services you need before starting the app
  //SocketClientService.getInstance(); // Assuming this is a singleton pattern

  // Start the app
  await app.listen(3000);
}

bootstrap();
