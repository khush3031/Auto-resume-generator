import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import passport from 'passport';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { mountRequestTrackerDashboard } from './common/request-tracker';
import {
  getAllowedCorsOrigins,
  shouldMountRequestTrackerDashboard,
} from './common/security.util';

async function bootstrap() {
  mongoose.set('sanitizeFilter', true);
  mongoose.set('strictQuery', true);

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use(passport.initialize());

  const allowedOrigins = getAllowedCorsOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isLoopbackOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
      if (isLoopbackOrigin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
  });

  const { httpAdapter } = app.get(HttpAdapterHost);
  const expressApp = httpAdapter.getInstance();
  expressApp.set('trust proxy', 1);

  expressApp.get('/__ping', (_req: unknown, res: { send: (value: string) => void }) => {
    res.send('ok');
  });

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resumeforge';
  if (shouldMountRequestTrackerDashboard()) {
    mountRequestTrackerDashboard(expressApp, mongoUri);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}`);
  if (shouldMountRequestTrackerDashboard()) {
    console.log(`Request tracker available at http://localhost:${port}/request-tracker`);
  }
}

bootstrap();
