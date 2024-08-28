import { LogLevel } from "@nestjs/common";

const logLevels: LogLevel[] = ["log", "error", "warn", "debug", "verbose"];

// Gets a list of log levels equal to, or higher, than the supplied minimum level
export function GetLogLevels(minLevel: string): LogLevel[] {
    // If nothing was supplied, use default values
    if (!minLevel) {
        return undefined;
    }

    const logIndex = logLevels.indexOf(minLevel as LogLevel);
    if (logIndex < 0) {
        throw new Error(`Invalid log level: "${minLevel}" supplied in environment`);
    }

    // We want to return all the HIGHER log levels and they are ranked high->low
    const higherLevels = logLevels.slice(0, logIndex + 1);
    return higherLevels;
}

export function formatEmail(email: string | undefined): typeof email {
    if (!email || typeof email !== "string") {
        return email;
    }

    if (email.includes(" ") || !email.includes("@")) {
        return email;
    }

    // Prefix default sender display name
    return `OS2iot ${email}`;
}
