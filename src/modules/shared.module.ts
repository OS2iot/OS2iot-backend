import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Application } from "@entities/application.entity";
import { DataTarget } from "@entities/data-target.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { GlobalAdminPermission } from "@entities/permissions/global-admin-permission.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { FiwareDataTarget } from "@entities/fiware-data-target.entity";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { OrganizationApplicationPermission } from "@entities/permissions/organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/permissions/organization-permission.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { Permission } from "@entities/permissions/permission.entity";
import { ReadPermission } from "@entities/permissions/read-permission.entity";
import { ReceivedMessage } from "@entities/received-message.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { User } from "@entities/user.entity";
import { DeviceModel } from "@entities/device-model.entity";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";
import { AuditLog } from "@services/audit-log.service";
import { ApiKey } from "@entities/api-key.entity";
import { ApiKeyPermission } from "@entities/api-key-permission.entity";
import { Multicast } from "@entities/multicast.entity";
import { LorawanMulticastDefinition } from "@entities/lorawan-multicast.entity";
import { OrganizationApplicationAdminPermission } from "@entities/permissions/organization-application-admin-permission.entity";
import { OrganizationUserAdminPermission } from "@entities/permissions/organization-user-admin-permission.entity";
import { OrganizationGatewayAdminPermission } from "@entities/permissions/organization-gateway-admin-permission.entity";
import { ControlledProperty } from "@entities/controlled-property.entity";
import { ApplicationDeviceType } from "@entities/application-device-type.entity";
import { ReceivedMessageSigFoxSignals } from "@entities/received-message-sigfox-signals.entity";
import { MqttDataTarget } from "@entities/mqtt-data-target.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ApiKey,
            Application,
            DataTarget,
            GenericHTTPDevice,
            GlobalAdminPermission,
            HttpPushDataTarget,
            FiwareDataTarget,
            MqttDataTarget,
            IoTDevice,
            IoTDevicePayloadDecoderDataTargetConnection,
            DeviceModel,
            LoRaWANDevice,
            OpenDataDkDataset,
            Organization,
            OrganizationApplicationPermission,
            OrganizationApplicationAdminPermission,
            OrganizationUserAdminPermission,
            OrganizationGatewayAdminPermission,
            OrganizationPermission,
            PayloadDecoder,
            Permission,
            ReadPermission,
            ReceivedMessage,
            ReceivedMessageMetadata,
            SigFoxDevice,
            SigFoxGroup,
            User,
            ApiKeyPermission,
            Multicast,
            LorawanMulticastDefinition,
            ControlledProperty,
            ApplicationDeviceType,
            ReceivedMessageSigFoxSignals,
        ]),
    ],
    providers: [AuditLog],
    exports: [TypeOrmModule, AuditLog],
})
export class SharedModule {}
