import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
  Logger as BuiltInLogger,
  LogLevel,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as compression from "compression";
import { AppModule } from "@modules/app.module";
import { ExpressAdapter } from "@nestjs/platform-express/adapters/express-adapter";
import * as cookieParser from "cookie-parser";
import { Express } from "express";
import { doubleCsrfProtection, doubleCsrf } from "csrf-csrf";

export const doubleCsrfUtilities = doubleCsrf({
  getSecret: () => "Secrets", // A function that optionally takes the request and returns a secret
  cookieName: "__Host-psifi.x-csrf-token", // The name of the cookie to be used, recommend using Host prefix.
  cookieOptions: {
    sameSite: "strict",
    path: "/",
    secure: true,
  },
  size: 64, // The size of the generated tokens in bits
  ignoredMethods: ["GET", "HEAD", "OPTIONS"], // A list of request methods that will not be protected.
  getTokenFromRequest: req => req.headers["x-csrf-token"], // A function that returns the token from the request
});

const {
  invalidCsrfTokenError, // This is just for convenience if you plan on making your own middleware.
  generateToken, // Use this in your routes to provide a CSRF hash + token cookie and token.
  validateRequest, // Also a convenience if you plan on making your own middleware.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrfUtilities;

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
  app.enableCors();
  app.use(compression());
  app.use(cookieParser());
  app.use(doubleCsrfProtection);

  BuiltInLogger.log(`Kafka: ${process.env.KAFKA_HOSTNAME || "localhost"}:${process.env.KAFKA_PORT || "9092"}`);

  return app;
}
