import { Logger } from "@nestjs/common";

export class NoOpLogger extends Logger {
    error(message: any, trace?: string, context?: string): void {}
    log(message: any, context?: string): void {}
    warn(message: any, context?: string): void {}
    debug(message: any, context?: string): void {}
}
