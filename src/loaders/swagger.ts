import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import Logger from './logger';

// guaranteed to get dependencies
export default (): Router => {
    const app = Router();
    const apis: any[] = [];

    const options = {
        swaggerDefinition: {
            openapi: "3.0.0",
            info: {
                title: "OS2-IoT Backend",
                version: "1.0.0",
                description: "The backend of OS2IoT",
                license: {
                    name: "MPL 2.0",
                    url: "https://www.mozilla.org/en-US/MPL/2.0/"
                },
                contact: {
                    name: "OS2",
                    url: "https://os2.eu/projekt/os2iot",
                    email: "ijom@aarhus.dk"
                }
            },
            servers: [
                {
                    url: "http://localhost:3000/api/v1"
                },
                {
                    url: "https://dev.os2iotdk/api/v1"
                },
                {
                    url: "https://test.os2iotdk/api/v1"
                }
            ]
        },
        apis: apis
    };

    const specs = swaggerJsdoc(options);
    app.use("/", swaggerUi.serve);
    app.get("/", swaggerUi.setup(specs, {
        explorer: true
    })
    );

    Logger.info('✌️ Swagger loaded');
    return app;
}
