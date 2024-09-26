import { LoRaWANGatewayController } from "@admin-controller/lorawan/lorawan-gateway.controller";
import { SharedModule } from "@modules/shared.module";
import { Module } from "@nestjs/common";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { GatewayStatusHistoryService } from "@services/chirpstack/gateway-status-history.service";
import { GatewayBootstrapperService } from "@services/chirpstack/gateway-boostrapper.service";
import { HttpModule } from "@nestjs/axios";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { OS2IoTMail } from "@services/os2iot-mail.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  controllers: [LoRaWANGatewayController],
  imports: [SharedModule, HttpModule, OrganizationModule, ConfigModule],
  providers: [ChirpstackGatewayService, GatewayStatusHistoryService, GatewayBootstrapperService, OS2IoTMail],
  exports: [GatewayStatusHistoryService],
})
export class LoRaWANGatewayModule {}
