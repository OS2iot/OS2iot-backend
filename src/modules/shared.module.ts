import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Application } from "@entities/application.entity";
import { DataTarget } from "@entities/data-target.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { Permission } from "@entities/permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { ReceivedMessage } from "@entities/received-message";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { User } from "@entities/user.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { SigFoxGroup } from "@entities/sigfox-group.entity";

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
            SigFoxGroup,
            User,
            WritePermission,
        ]),
    ],
    exports: [TypeOrmModule],
})
export class SharedModule {}
