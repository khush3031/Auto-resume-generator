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

  
  // ── Trust the reverse-proxy headers forwarded by Render.com (and similar) ───
  // Render terminates TLS at its load-balancer and forwards the real protocol in
  // X-Forwarded-Proto.  Without this, Express sees req.protocol === 'http' even
  // on an HTTPS deployment, which makes the dashboard serve a DATA_URL that
  // starts with "http://" — blocked by the browser as Mixed Content.
  const { httpAdapter } = app.get(HttpAdapterHost);
  const expressApp = httpAdapter.getInstance();
  expressApp.set('trust proxy', 1);   // <── fixes req.protocol on Render / Railway / Fly / Heroku

  // ── Mount request-tracker dashboard on the underlying Express instance ──────
  // Dashboard UI  → /request-tracker
  // JSON API      → /admin/request-tracker/*
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
