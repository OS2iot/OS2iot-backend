import { Module } from "@nestjs/common";

import { DefaultController } from "@admin-controller/default.controller";
import { HealthCheckModule } from "@modules/health-check.module";

@Module({
    imports: [HealthCheckModule],
    controllers: [DefaultController],
})
export class DefaultModule {}
