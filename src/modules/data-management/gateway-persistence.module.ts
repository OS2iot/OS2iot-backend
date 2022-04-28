import configuration from "@config/configuration";
import { ChirpstackBackendModule } from "@modules/device-integrations/chirpstack-backend.module";
import { SharedModule } from "@modules/shared.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GatewayPersistenceService } from "@services/data-management/gateway-persistence.service";

@Module({
    imports: [
        SharedModule,
        ConfigModule.forRoot({ load: [configuration] }),
        ChirpstackBackendModule,
    ],
    exports: [],
    providers: [GatewayPersistenceService],
})
export class GatewayPersistenceModule {}
