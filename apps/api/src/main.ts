import { NestFactory } from '@nestjs/core';
import { HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { mountRequestTrackerDashboard } from './common/request-tracker';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use(passport.initialize());

  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') ?? [
    'http://localhost:3000',
    'https://resumeforge-web.onrender.com',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  
  // ── Mount request-tracker dashboard on the underlying Express instance ──────
  // Must be called AFTER app.listen() so the Express app is fully initialised.
  // Dashboard UI  → http://localhost:<port>/request-tracker
  // JSON API      → http://localhost:<port>/admin/request-tracker/*
  const { httpAdapter } = app.get(HttpAdapterHost);
  const expressApp = httpAdapter.getInstance();
  expressApp.get('/__ping', (_req: any, res: { send: (arg0: string) => any; }) => res.send('ok'));
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resumeforge';
  mountRequestTrackerDashboard(expressApp, mongoUri);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}`);
  console.log(`Request tracker → http://localhost:${port}/request-tracker`);
}

bootstrap();
