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

    BuiltInLogger.log(
        `Kafka: ${process.env.KAFKA_HOSTNAME || "localhost"}:${
            process.env.KAFKA_PORT || "9092"
        }`
    );

    return app;
}
