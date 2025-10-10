import { formatEmail, GetLogLevels } from "@helpers/env-variable-helper";

export default (): any => {
  return {
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
      host: process.env.DATABASE_HOSTNAME || "host.docker.internal",
      port: parseInt(process.env.DATABASE_PORT, 10) || 5433,
      username: process.env.DATABASE_USERNAME || "os2iot",
      password: process.env.DATABASE_PASSWORD || "toi2so",
      ssl: process.env.DATABASE_ENABLE_SSL === "true",
      timezone: "Z",
    },
    jwt: {
      secret: process.env.JWT_SECRET || "secretKey-os2iot-secretKey",
      expiresIn: process.env.JWT_EXPIRESIN || "9h",
    },
    backend: {
      baseurl: process.env.BACKEND_BASEURL || "https://localhost:3000",
      deviceStatsIntervalInDays: parseInt(process.env.DEVICE_STATS_INTERVAL_IN_DAYS, 10) || 29,
      datatargetLogMaxEvents: process.env.DATATARGET_LOG_MAX_EVENTS || 250,
    },
    kombit: {
      entryPoint:
        process.env.KOMBIT_ENTRYPOINT ||
        "https://adgangsstyring.eksterntest-stoettesystemerne.dk/runtime/saml2/issue.idp",
      certificatePublicKey: process.env.KOMBIT_CERTIFICATEPUBLICKEY || "INSERT_KOMBIT_CERT", // Public certificate from Kombit Test server
      certificatePrivateKey: process.env.KOMBIT_CERTIFICATEPRIVATEKEY || "",
      roleUri: process.env.KOMBIT_ROLE_NAME || "http://os2iot.dk/roles/usersystemrole/adgang/",
    },
    chirpstack: {
      apikey: process.env.CHIRPSTACK_API_KEY || "apikey",
      hostname: process.env.CHIRPSTACK_HOSTNAME || "localhost",
      port: process.env.CHIRPSTACK_PORT || 8080,
    },
    logLevels: process.env.LOG_LEVEL ? GetLogLevels(process.env.LOG_LEVEL) : GetLogLevels("debug"),
    email: {
      host: process.env.EMAIL_HOST || "smtp.ethereal.email",
      port: process.env.EMAIL_PORT || 587,
      user: process.env.EMAIL_USER || "tremayne38@ethereal.email",
      pass: process.env.EMAIL_PASS || "UjbMtRZNkrUcVJsvTM",
      /**
       * Can be formatted to show a user-friendly name before the e-mail.
       * E.g. "OS2iot <sender@mail.com>"
       */
      from: process.env.EMAIL_FROM ? formatEmail(process.env.EMAIL_FROM) : "OS2iot tremayne38@ethereal.email",
    },
    frontend: {
      baseurl: process.env.FRONTEND_BASEURL || "http://localhost:8081",
    },
  };
};
