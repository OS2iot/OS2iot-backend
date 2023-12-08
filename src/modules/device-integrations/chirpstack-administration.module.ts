import { ChirpstackGatewayController } from "@admin-controller/chirpstack/chirpstack-gateway.controller";
import { DeviceProfileController } from "@admin-controller/chirpstack/device-profile.controller";
import configuration from "@config/configuration";
import { SharedModule } from "@modules/shared.module";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ApplicationChirpstackService } from "@services/chirpstack/chirpstack-application.service";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";

@Module({
    controllers: [
        ChirpstackGatewayController,
        DeviceProfileController,
    ],
    imports: [SharedModule, HttpModule, OrganizationModule, ConfigModule.forRoot({ load: [configuration] })],
    providers: [
        GenericChirpstackConfigurationService,
        ChirpstackGatewayService,
        DeviceProfileService,
        ChirpstackDeviceService,
        ApplicationChirpstackService
    ],
    exports: [ChirpstackDeviceService, ChirpstackGatewayService, DeviceProfileService, ApplicationChirpstackService],
})
export class ChirpstackAdministrationModule {}
