import { Module } from "@nestjs/common";
import { HealthCheckService } from "@services/health/health-check.service";

@Module({ providers: [HealthCheckService], exports: [HealthCheckService] })
export class HealthCheckModule {}
