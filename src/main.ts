import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";

async function bootstrap() {
    const NEST_PORT = 3000;
    const API_PREFIX = "/api";
    const CURRENT_VERSION_PREFIX = API_PREFIX + "/v1";
    const SWAGGER_PREFIX = CURRENT_VERSION_PREFIX + "/docs";

    const app = await NestFactory.create(AppModule);

    const options = new DocumentBuilder()
        .setTitle("OS2IoT - Backend")
        .setDescription("The back-end for OS2IoT")
        .setVersion("1.0")
        .addTag("os2iot")
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(SWAGGER_PREFIX, app, document);

    app.setGlobalPrefix(CURRENT_VERSION_PREFIX);

    await app.listen(NEST_PORT);
    const url = await app.getUrl();
    await Logger.log(`Swagger on: ${url}${SWAGGER_PREFIX}`);
    await Logger.log(`Application started on: ${url}${CURRENT_VERSION_PREFIX}`);
}
bootstrap();
