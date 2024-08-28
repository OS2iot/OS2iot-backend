import configuration from "@config/configuration";
import { LoRaWANGatewayModule } from "@modules/device-integrations/lorawan-gateway.module";
import { SharedModule } from "@modules/shared.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GatewayPersistenceService } from "@services/data-management/gateway-persistence.service";

@Module({
  imports: [SharedModule, ConfigModule.forRoot({ load: [configuration] }), LoRaWANGatewayModule],
  exports: [],
  providers: [GatewayPersistenceService],
})
export class GatewayPersistenceModule {}
