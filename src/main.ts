import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita validação global de DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Configuração da documentação Swagger
  const config = new DocumentBuilder()
    .setTitle('Mega Man & Bass Database API')
    .setDescription('API REST para gerenciamento de personagens e Robot Masters da saga clássica')
    .setVersion('1.0')
    .addTag('characters')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log('Aplicação rodando em: http://localhost:3000');
  console.log('Swagger acessível em: http://localhost:3000/api');
}
bootstrap();