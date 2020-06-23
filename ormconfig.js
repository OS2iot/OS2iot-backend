var path = require("path");

/**
 * We use ormconfig.js, such that the entities can be refered to using code.
 */
module.exports = {
    type: "postgres",
    host: "host.docker.internal",
    port: 5432,
    username: "os2iot",
    password: "toi2so",
    database: "os2iot",
    synchronize: true,
    logging: false,
    entities: [path.join(__dirname, "/../**/*.entity{.ts,.js}")],
    migrations: ["src/migration/**/*.ts"],
    subscribers: ["src/subscriber/**/*.ts"],
    cli: {
        entitiesDir: "src/entity",
        migrationsDir: "src/migration",
        subscribersDir: "src/subscriber",
    },
};
