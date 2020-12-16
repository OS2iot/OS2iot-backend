import { Logger } from "@nestjs/common";

export class NoOpLogger extends Logger {
    error(message: unknown | string, trace?: string, context?: string): void {
        // intentionally left blank
    }
    log(message: unknown | string, context?: string): void {
        // intentionally left blank
    }
    warn(message: unknown | string, context?: string): void {
        // intentionally left blank
    }
    debug(message: unknown | string, context?: string): void {
        // intentionally left blank
    }
}
