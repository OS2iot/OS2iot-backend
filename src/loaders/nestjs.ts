import { INestApplication, ValidationPipe } from "@nestjs/common";
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
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors();
    return app;
}
