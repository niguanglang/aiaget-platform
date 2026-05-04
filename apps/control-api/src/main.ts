import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, text, urlencoded } from 'express';

import { AppModule } from './app.module';
import { requireEnv } from './common/env';
import type { RequestWithContext } from './common/types/request-context';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.CONTROL_API_PORT ?? 3001);
  const corsOrigins = requireEnv('CORS_ORIGIN')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(json({ limit: '30mb', verify: preserveRawBody }));
  app.use(urlencoded({ extended: true, limit: '30mb', verify: preserveRawBody }));
  app.use(text({ limit: '30mb', type: ['application/xml', 'text/xml', 'text/plain'], verify: preserveRawBody }));
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    credentials: true,
    origin: corsOrigins,
  });
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      transform: true,
      whitelist: true,
    }),
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle('Enterprise Agent Platform Control API')
    .setDescription('Control Plane API for tenant, configuration, audit, and run metadata.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Tenant API key for external Agent invocation.',
      },
      'x-api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
}

void bootstrap();

function preserveRawBody(req: unknown, _res: unknown, buffer: Buffer) {
  (req as RequestWithContext).rawBody = buffer.toString('utf8');
}
