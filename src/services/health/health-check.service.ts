import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class HealthCheckService {
    private readonly logger = new Logger(HealthCheckService.name);

    // start at startup time ...
    public lastHeartbeat: number = new Date().valueOf();

    private readonly MAX_HEARTBEAT_DELAY = 60000;

    isKafkaOk(): boolean {
        const isOk =
            new Date().valueOf() - this.lastHeartbeat <= this.MAX_HEARTBEAT_DELAY;
        if (!isOk) {
            this.logger.error(
                `Healthcheck not OK. Last heartbeat from Kafka was at ${this.lastHeartbeat}`
            );
        }
        return isOk;
    }
}
