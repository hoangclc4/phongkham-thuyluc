import { ValidationPipe } from '@nestjs/common';
import { TestingModuleBuilder } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';

export async function createTestApp(moduleBuilder: TestingModuleBuilder): Promise<NestFastifyApplication> {
  const module = await moduleBuilder.compile();
  const app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.register(multipart as Parameters<typeof app.register>[0]);
  await app.register(fastifyCookie as Parameters<typeof app.register>[0]);
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
