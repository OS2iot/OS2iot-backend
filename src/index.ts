import "reflect-metadata"; // We need this in order to use @Decorators
import config from "./config";
import express from "express";
import Logger from "./loaders/logger";

async function startServer() {
    const app = express();

    /**
     * A little hack here
     * Import/Export can only be used in 'top-level code'
     * Well, at least in node 10 without babel and at the time of writing
     * So we are using good old require.
     **/
    await require("./loaders").default({ expressApp: app }); // eslint-disable-line @typescript-eslint/no-var-requires

    app.listen(config.port, (err) => {
        if (err) {
            Logger.error(err);
            process.exit(1);
        }
        Logger.info(`
      ################################################
      🛡️  Server listening on port: ${config.port}   🛡️ 
      📚  Docs: http://localhost:3000/api/v1/docs/   📚
      ################################################
    `);
    });
}

/**
 * Avoid crashing if an unhandled promise rejection occurs, instead log it.
 */
process.on("unhandledRejection", (error, promise) => {
    Logger.error("We forgot to handle a promise rejection here: ", promise);
    Logger.error(" - The error was: ", error);
});

startServer();
