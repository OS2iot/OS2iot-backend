export default (): any => {
    return {
        port: parseInt(process.env.PORT, 10) || 3000,
        database: {
            host: process.env.DATABASE_HOST || "host.docker.internal",
            port: parseInt(process.env.DATABASE_PORT, 10) || 5433,
            username: process.env.DATABASE_USERNAME || "os2iot",
            password: process.env.DATABASE_PASSWORD || "toi2so",
        },
        // kafka: {
        //     hostname: process.env.KAFKA_HOSTNAME || "host.docker.internal",
        //     port: process.env.KAFKA_PORT || "9093",
        //     clientId: process.env.KAFKA_CLIENTID || "os2iot-client",
        //     groupdId: process.env.KAFKA_GROUPID || "os2iot-backend",
        // },
        jwt: {
            secret: process.env.JWT_SECRET || "secretKey-os2iot-secretKey",
            expiresIn: process.env.JWT_EXPIRESIN || "9h",
        },
    };
};
