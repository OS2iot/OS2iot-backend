import { Module, forwardRef, HttpModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PayloadDecoderService } from "@services/payload-decoder.service";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { ApplicationModule } from "@modules/application.module";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "./iot-device-payload-decoder-data-target-connection.module";
import { DataTargetModule } from "./data-target.module";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";
import { Permission } from "@entities/permission.entity";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { AuthModule } from "./auth.module";
import { OrganizationModule } from "./organization.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PayloadDecoder,
            Application,
            IoTDevice,
            GenericHTTPDevice,
            IoTDevicePayloadDecoderDataTargetConnection,
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
        DataTargetModule,
        forwardRef(() => IoTDevicePayloadDecoderDataTargetConnectionModule),
        ChirpstackAdministrationModule,
        HttpModule,
        AuthModule,
        OrganizationModule,
    ],
    exports: [TypeOrmModule, PayloadDecoderService],
    controllers: [PayloadDecoderController],
    providers: [PayloadDecoderService],
})
export class PayloadDecoderModule {}
