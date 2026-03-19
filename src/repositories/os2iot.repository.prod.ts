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
  // Production paths point to compiled JavaScript files
  entities: ["dist/entities/*.js", "dist/entities/permissions/*.js"],
  migrations: ["dist/migration/*.js"],
  ssl: process.env.DATABASE_ENABLE_SSL === "true",
});

/**
 * Production datasource for CLI migration use.
 * Uses compiled JS files instead of TypeScript for faster execution.
 */
export default os2IotContext;
