import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication, SWAGGER_PREFIX: string): void {
    const options = new DocumentBuilder()
        .setTitle("OS2IoT - Backend")
        .setDescription("The back-end for OS2IoT")
        .setVersion("1.0")
        .addTag("os2iot")
        .addApiKey({ type: "apiKey", name: "X-API-KEY", in: "header" }, "X-API-KEY")
        .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" })
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(SWAGGER_PREFIX, app, document);
}
