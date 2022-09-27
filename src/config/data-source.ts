import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOSTNAME || "host.docker.internal",
    port: parseInt(process.env.DATABASE_PORT ?? '', 10) || 5433,
    username: process.env.DATABASE_USERNAME || "os2iot",
    password: process.env.DATABASE_PASSWORD || "toi2so",
    database: "os2iot",
    synchronize: false,
    logging: false,
    entities: ["../entities/*.ts", "../entities/permissions/*.ts"],
    migrations: ["../migration/*.ts"],
});

/**
 * For CLI migration use only
 */
export default AppDataSource;
