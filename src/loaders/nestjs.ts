import configuration from "@config/configuration";
import { AppModule } from "@modules/app.module";
import {
  BadRequestException,
  Logger as BuiltInLogger,
  INestApplication,
  LogLevel,
  ValidationPipe,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express/adapters/express-adapter";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import { doubleCsrf, doubleCsrfProtection } from "csrf-csrf";
import { Express } from "express";

export const doubleCsrfUtilities = doubleCsrf({
  getSecret: () => configuration()["csrf"]["secret"],
  cookieName: "x-csrf-cookie", // TODO: consider adding security prefixes for production
  cookieOptions: {
    sameSite: "strict",
    path: "/",
    secure: true,
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: req => req.headers["x-csrf-token"],
});

const { doubleCsrfProtection } = doubleCsrfUtilities;

export async function setupNestJs(
  config: {
    NEST_PORT: number;
    API_PREFIX: string;
    CURRENT_VERSION_PREFIX: string;
    SWAGGER_PREFIX: string;
    LOG_LEVELS: LogLevel[];
  },
  server: Express
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { logger: config.LOG_LEVELS });
  app.setGlobalPrefix(config.CURRENT_VERSION_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: errors => {
        // Throw exception if any controller validation fails. Will also fail if a property has a type
        // but doesn't have the proper decorator (like @IsNumber() for a number property)
        return new BadRequestException(errors);
      },
    })
  );
  app.enableCors({
    origin: configuration()["frontend"]["baseurl"],
    credentials: true,
  });
  app.use(compression());
  app.use(cookieParser());
  app.use(doubleCsrfProtection);

  BuiltInLogger.log(`Kafka: ${process.env.KAFKA_HOSTNAME || "localhost"}:${process.env.KAFKA_PORT || "9092"}`);

  return app;
}
