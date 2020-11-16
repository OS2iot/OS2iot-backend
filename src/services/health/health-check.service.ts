import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthCheckService {
    // start at startup time ...
    public lastHeartbeat: number = new Date().valueOf();

    private readonly MAX_HEARTBEAT_DELAY = 60000;

    isKafkaOk(): boolean {
        return new Date().valueOf() - this.lastHeartbeat <= this.MAX_HEARTBEAT_DELAY;
    }
}
