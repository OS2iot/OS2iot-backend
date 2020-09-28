import {
    BadRequestException,
    INestApplication,
    Logger,
    ValidationPipe,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "@modules/app.module";

export async function setupNestJs(config: {
    NEST_PORT: number;
    API_PREFIX: string;
    CURRENT_VERSION_PREFIX: string;
    SWAGGER_PREFIX: string;
}): Promise<INestApplication> {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix(config.CURRENT_VERSION_PREFIX);
    app.useGlobalPipes(
        new ValidationPipe({
            exceptionFactory: errors => {
                return new BadRequestException(errors);
            },
        })
    );
    app.enableCors();

    Logger.log(
        `Kafka: ${process.env.KAFKA_HOSTNAME || "host.docker.internal"}:${
            process.env.KAFKA_PORT || "9092"
        }`
    );

    return app;
}
