import { Logger } from "@nestjs/common";

export class NoOpLogger extends Logger {
    error(message: any, trace?: string, context?: string): void {
        // intentionally left blank
    }
    log(message: any, context?: string): void {
        // intentionally left blank
    }
    warn(message: any, context?: string): void {
        // intentionally left blank
    }
    debug(message: any, context?: string): void {
        // intentionally left blank
    }
}
