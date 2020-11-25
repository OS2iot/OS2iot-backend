import {
    BadRequestException,
    INestApplication,
    ValidationPipe,
    Logger as BuiltInLogger,
} from "@nestjs/common";
import { Logger } from "nestjs-pino";
import { NestFactory } from "@nestjs/core";
import * as compression from "compression";
import { AppModule } from "@modules/app.module";
import { ExpressAdapter } from "@nestjs/platform-express/adapters/express-adapter";
import * as cookieParser from "cookie-parser";
import { Express } from "express";

export async function setupNestJs(
    config: {
        NEST_PORT: number;
        API_PREFIX: string;
        CURRENT_VERSION_PREFIX: string;
        SWAGGER_PREFIX: string;
    },
    server: Express
): Promise<INestApplication> {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.setGlobalPrefix(config.CURRENT_VERSION_PREFIX);
    app.useGlobalPipes(
        new ValidationPipe({
            exceptionFactory: errors => {
                return new BadRequestException(errors);
            },
        })
    );
    app.enableCors();
    app.use(compression());
    app.use(cookieParser());

    BuiltInLogger.log(
        `Kafka: ${process.env.KAFKA_HOSTNAME || "host.docker.internal"}:${
            process.env.KAFKA_PORT || "9092"
        }`
    );

    return app;
}
