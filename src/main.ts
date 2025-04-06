import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import session from 'express-session';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Debug: Log environment variables
  console.log('Environment variables:', {
    SESSION_SECRET: process.env.SESSION_SECRET,
    NODE_ENV: process.env.NODE_ENV
  });

  // Enable CORS with proper configuration
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Session middleware
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET is not defined in environment variables');
  }

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
        path: '/', // Ensure cookie is available for all paths
      },
      name: 'sessionId',
      store: new session.MemoryStore(), // Use memory store for development
      rolling: true, // Refresh session on each request
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Wallet Management API')
    .setDescription('API for managing user wallets with Google OAuth')
    .setVersion('1.0')
    .addTag('wallet')
    .addTag('user')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
bootstrap(); 