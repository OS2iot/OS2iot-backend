import { ChirpstackGatewayController } from "@admin-controller/chirpstack/chirpstack-gateway.controller";
import { DeviceProfileController } from "@admin-controller/chirpstack/device-profile.controller";
import { ServiceProfileController } from "@admin-controller/chirpstack/service-profile.controller";
import configuration from "@config/configuration";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { NetworkServerController } from "@admin-controller/chirpstack/network-server.controller";

@Module({
    controllers: [
        ChirpstackGatewayController,
        ServiceProfileController,
        DeviceProfileController,
        NetworkServerController
    ],
    imports: [HttpModule, ConfigModule.forRoot({ load: [configuration] })],
    providers: [
        GenericChirpstackConfigurationService,
        ChirpstackSetupNetworkServerService,
        ChirpstackGatewayService,
        ServiceProfileService,
        DeviceProfileService,
        ChirpstackDeviceService,
    ],
    exports: [ChirpstackDeviceService, ChirpstackGatewayService],
})
export class ChirpstackAdministrationModule {}
