import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplatesModule } from './templates/templates.module';
import { ResumesModule } from './resumes/resumes.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SeederModule } from './seeder/seeder.module';
import { AiModule } from './ai/ai.module';
import { UploadModule } from './upload/upload.module';
import { RequestTrackerNestMiddleware } from './common/request-tracker';
import { RateLimitGuard } from './common/rate-limit.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/resumeforge',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    TemplatesModule,
    ResumesModule,
    SeederModule,
    AiModule,
    UploadModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {
  // Apply request-tracker middleware to every route (*)
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestTrackerNestMiddleware)
      .forRoutes('*');
  }
}
