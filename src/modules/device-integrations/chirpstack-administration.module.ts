import { HttpModule, Module } from "@nestjs/common";

import { ChirpstackGatewayController } from "@admin-controller/chirpstack/chirpstack-gateway.controller";
import { DeviceProfileController } from "@admin-controller/chirpstack/device-profile.controller";
import { ServiceProfileController } from "@admin-controller/chirpstack/service-profile.controller";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";

@Module({
    controllers: [
        ChirpstackGatewayController,
        ServiceProfileController,
        DeviceProfileController,
    ],
    imports: [HttpModule],
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
