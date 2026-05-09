import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  // SWAGGER
  const config = new DocumentBuilder()
    .setTitle('API Monitor')
    .setDescription('Sistema de monitoramento de APIs')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('monitor', app, document);

  const port = process.env.PORT || 3001;

  await app.listen(port);

  console.log(`🚀 API Monitor rodando na porta ${port}`);
  console.log(`📘 Swagger: http://localhost:${port}/swagger`);
}

bootstrap();