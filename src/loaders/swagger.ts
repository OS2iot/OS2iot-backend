import { Router } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import Logger from "./logger";
import user from "../api/routes/user";

// guaranteed to get dependencies
export default (): Router => {
    const app = Router();

    const options = {
        swaggerDefinition: {
            openapi: "3.0.0",
            info: {
                title: "OS2-IoT Backend",
                version: "1.0.0",
                description: "The backend of OS2IoT",
                license: {
                    name: "MPL 2.0",
                    url: "https://www.mozilla.org/en-US/MPL/2.0/",
                },
                contact: {
                    name: "OS2",
                    url: "https://os2.eu/projekt/os2iot",
                    email: "ijom@aarhus.dk",
                },
            },
            host: "localhost:3000",
            basePath: "/v1",
            produces: ["application/json"],
            // schemes: ["http", "https"],
            servers: [
                {
                    url: "http://localhost:3000/api/v1",
                },
                {
                    url: "https://dev.os2iotdk/api/v1",
                },
                {
                    url: "https://test.os2iotdk/api/v1",
                },
            ],
        },
        apis: ["./src/**/*.ts"],
        // basedir: __dirname, //app absolute path
    };

    const specs = swaggerJsdoc(options);
    app.use("/", swaggerUi.serve);
    app.get(
        "/",
        swaggerUi.setup(specs, {
            explorer: true,
        })
    );

    Logger.info("✌️ Swagger loaded");
    return app;
};
