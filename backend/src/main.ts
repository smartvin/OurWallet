import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend communication
  app.enableCors();
  
  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('MultiWallet LINE Auth API')
    .setDescription('Minimal LINE authentication service for DePick.BE integration')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`MultiWallet LINE Auth service running on port ${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();