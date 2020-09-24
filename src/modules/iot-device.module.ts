import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { IoTDeviceController } from "@admin-controller/iot-device.controller";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { DataTarget } from "@entities/data-target.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { ReceivedMessage } from "@entities/received-message";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { ChirpstackAdministrationModule } from "./device-integrations/chirpstack-administration.module";
import { ApplicationModule } from "./application.module";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { Permission } from "@entities/permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { User } from "@entities/user.entity";
import { WritePermission } from "@entities/write-permission.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Application,
            DataTarget,
            GenericHTTPDevice,
            GlobalAdminPermission,
            HttpPushDataTarget,
            IoTDevice,
            IoTDevicePayloadDecoderDataTargetConnection,
            LoRaWANDevice,
            Organization,
            OrganizationAdminPermission,
            OrganizationApplicationPermission,
            OrganizationPermission,
            PayloadDecoder,
            Permission,
            ReadPermission,
            ReceivedMessage,
            ReceivedMessageMetadata,
            SigFoxDevice,
            User,
            WritePermission,
        ]),
        ChirpstackAdministrationModule,
        ApplicationModule,
    ],
    exports: [IoTDeviceService],
    controllers: [IoTDeviceController],
    providers: [IoTDeviceService],
})
export class IoTDeviceModule {}
