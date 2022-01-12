export = {
    type: "postgres" as const,
    host: process.env.DATABASE_HOSTNAME || "host.docker.internal",
    port: parseInt(process.env.DATABASE_PORT, 10) || 5433,
    username: process.env.DATABASE_USERNAME || "os2iot",
    password: process.env.DATABASE_PASSWORD || "toi2so",
    database: "os2iot",
    synchronize: false,
    logging: false,
    entities: ["src/entities/*.ts", "src/entities/permissions/*.ts"],
    migrations: ["src/migration/*.ts"],
    cli: {
        "migrationsDir": "src/migration"
    }
}
