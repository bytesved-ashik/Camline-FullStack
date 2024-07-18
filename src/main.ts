import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { urlencoded } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const config = new ConfigService();
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    cors: {
      origin: '*',
    },
  });

  const PORT = config.getPortConfig() || process.env.PORT || 8084;

  const APP_NAME = 'Camline 24hertherapy';
  const APP_VERSION = '1.0.0';

  const swaggerConfig = new DocumentBuilder()
    .setTitle(APP_NAME)
    .setDescription(`The ${APP_NAME} API description`)
    .setVersion(APP_VERSION)
    .addBearerAuth()
    .build();

  const swaggerOptions: SwaggerDocumentOptions = {
    operationIdFactory: (_: string, methodKey: string) => methodKey,
  };

  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
    swaggerOptions,
  );
  SwaggerModule.setup('api-docs', app, document);

  // Serve static files from the "storage" directory
  app.use('/storage', express.static(path.join(__dirname, '../storage')));

  app.use(urlencoded({ limit: '100mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Configure EJS as the view engine
  app.setBaseViewsDir(path.join(__dirname, '..', 'src/views'));
  app.setViewEngine('ejs');

  await app.listen(PORT);

  logger.log(`Nest application is running on: ${PORT}`);
}
bootstrap();
