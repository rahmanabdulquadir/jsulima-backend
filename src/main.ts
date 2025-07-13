/* eslint-disable prettier/prettier */
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import * as bodyParser from 'body-parser';


async function seedAdmin() {
  const prisma = new PrismaClient();
  const adminEmail = 'admin@jsulima.com';

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const hashed = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        fullName: 'Admin',
        email: adminEmail,
        password: hashed,
        role: 'ADMIN',
        // profile: {
        //   create: {
        //     name: 'Super Admin',
        //   },
        // },
      },
    });
    console.log('✅ Admin seeded');
  }
  await prisma.$disconnect();
}
async function bootstrap() {
  dotenv.config();
  await seedAdmin();
  const app = await NestFactory.create(AppModule);
 
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('JSULIMA API')
    .setDescription('API documentation for JSULIMA backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    ) 
    .build();

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors(); 
  app.use('/webhook/stripe', bodyParser.raw({ type: 'application/json' }));
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); 

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
