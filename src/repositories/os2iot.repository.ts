import { DataSource } from "typeorm";

const os2IotContext = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOSTNAME || "host.docker.internal",
    port: parseInt(process.env.DATABASE_PORT ?? "", 10) || 5433,
    username: process.env.DATABASE_USERNAME || "os2iot",
    password: process.env.DATABASE_PASSWORD || "toi2so",
    database: "os2iot",
    synchronize: false,
    logging: false,
    // For some reason, entities path is from where "typeorm" is executed from console.
    // TypeORM commands are executed from the root folder.
    entities: ["src/entities/*.ts", "src/entities/permissions/*.ts"],
    // From v3, it's no longer used as output path...
    migrations: ["src/migration/*.ts"],
});

/**
 * For CLI migration use only!
 */
export default os2IotContext;
