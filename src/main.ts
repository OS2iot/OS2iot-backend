import { Logger } from "@nestjs/common";
import { setupSwagger } from "@loaders/swagger";
import { setupNestJs } from "@loaders/nestjs";

async function bootstrap() {
    const config = {
        NEST_PORT: 3000,
        API_PREFIX: "/api",
        CURRENT_VERSION_PREFIX: "/api" + "/v1",
        SWAGGER_PREFIX: "/api" + "/v1" + "/docs",
    };

    const app = await setupNestJs(config);
    setupSwagger(app, config.SWAGGER_PREFIX);

    // The .listen call must happen after swagger is setup.
    await app.listen(config.NEST_PORT);

    const url = await app.getUrl();
    Logger.log(`Swagger on: ${url}${config.SWAGGER_PREFIX}`);
    Logger.log(`Application started on: ${url}${config.CURRENT_VERSION_PREFIX}`);
}
void bootstrap();
