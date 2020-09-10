import { Module, HttpModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { DataTarget } from "@entities/data-target.entity";
import { DeviceIntegrationPersistenceService } from "@services/data-management/device-integration-persistence.service";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { ReceivedMessage } from "@entities/received-message";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { ApplicationModule } from "@modules/application.module";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";
import { Permission } from "@entities/permission.entity";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { AuthModule } from "../../auth/auth.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Application,
            IoTDevice,
            DataTarget,
            ReceivedMessage,
            ReceivedMessageMetadata,
            Organization,
            User,
            Permission,
            GlobalAdminPermission,
            OrganizationPermission,
            OrganizationAdminPermission,
            OrganizationApplicationPermission,
            ReadPermission,
            WritePermission,
        ]),
        IoTDeviceModule,
        ApplicationModule,
        ChirpstackAdministrationModule,
        HttpModule,
        AuthModule,
    ],
    exports: [TypeOrmModule],
    providers: [DeviceIntegrationPersistenceService, ChirpstackDeviceService],
})
export class DeviceIntegrationPersistenceModule {}
