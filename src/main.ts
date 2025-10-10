import { Logger as BuiltInLogger } from "@nestjs/common";
import * as fs from "fs";
import * as express from "express";
import * as http from "http";
import * as https from "https";
import * as dotenv from "dotenv";

import { setupNestJs } from "@loaders/nestjs";
import { setupSwagger } from "@loaders/swagger";
import configuration from "@config/configuration";
import helmet from "helmet";

async function bootstrap() {
  // Load .env file as environment before startup.
  dotenv.config({ path: "./.env", debug: true });

  const config = {
    NEST_PORT: 3000,
    API_PREFIX: "/api",
    CURRENT_VERSION_PREFIX: "/api" + "/v1",
    SWAGGER_PREFIX: "/api" + "/v1" + "/docs",
    LOG_LEVELS: configuration()["logLevels"],
  };
  const server = express();

  // Set security headers using Helmet
  server.use(
    helmet({
      referrerPolicy: { policy: "no-referrer-when-downgrade" },
      xFrameOptions: { action: "deny" },
      hidePoweredBy: true,
      strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: true },
    })
  );

  const app = await setupNestJs(config, server);
  setupSwagger(app, config.SWAGGER_PREFIX);

  BuiltInLogger.debug(`BaseUrl: '${configuration()["backend"]["baseurl"]}'`, "Kombit");
  BuiltInLogger.debug(`EntryPoint: '${configuration()["kombit"]["entryPoint"]}'`, "Kombit");

  // The .listen call must happen after swagger is setup.
  // await app.listen(config.NEST_PORT);
  await app.init();
  const httpServer = http.createServer(server).listen(3000);
  try {
    const httpsOptions = {
      key: fs.readFileSync("../secrets/private.key"),
      cert: fs.readFileSync("../secrets/publiccert.crt"),
    };
    https.createServer(httpsOptions, server).listen(8443);
  } catch (err) {
    BuiltInLogger.log("Could not setup https, skipping.");
  }
}
void bootstrap();
