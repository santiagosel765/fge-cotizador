import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { CreditRequestsModule } from './modules/credit-requests/credit-requests.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().default(3001),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASS: Joi.string().allow('').required(),
        DB_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
        GEMINI_API_KEY: Joi.string().allow('').required(),
        GEMINI_MODEL_PLAN: Joi.string().default('gemini-2.5-pro'),
        GEMINI_MODEL_CHAT: Joi.string().default('gemini-2.5-flash'),
        GEMINI_MODEL_IMAGE: Joi.string().default('imagen-4.0-generate-001'),
        ASSETS_BASE_URL: Joi.string().uri().required(),
        RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
        RATE_LIMIT_MAX: Joi.number().default(60),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [{
        ttl: configService.get<number>('RATE_LIMIT_WINDOW_MS', 60000),
        limit: configService.get<number>('RATE_LIMIT_MAX', 60),
      }],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    MaterialsModule,
    QuotationsModule,
    AiModule,
    CreditRequestsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
