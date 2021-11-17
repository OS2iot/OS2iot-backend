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
import { OrganizationPermission } from "@entities/organization-permission.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { Permission } from "@entities/permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { ReceivedMessage } from "@entities/received-message.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { User } from "@entities/user.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { DeviceModel } from "@entities/device-model.entity";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";
import { AuditLog } from "@services/audit-log.service";
import { Multicast } from "@entities/multicast.entity";

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
            DeviceModel,
            LoRaWANDevice,
            OpenDataDkDataset,
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
            Multicast,
        ]),
    ],
    providers: [AuditLog],
    exports: [TypeOrmModule, AuditLog],
})
export class SharedModule {}
