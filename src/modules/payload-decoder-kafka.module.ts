import { Module, HttpModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { PayloadDecoderListenerService } from "@services/payload-decoder-listener.service";
import { KafkaModule } from "@modules/kafka.module";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "@modules/iot-device-payload-decoder-data-target-connection.module";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { PayloadDecoderService } from "@services/payload-decoder.service";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { DataTargetModule } from "@modules/data-target.module";
import { PayloadDecoderModule } from "@modules/payload-decoder.module";
import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";
import { Permission } from "@entities/permission.entity";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { ApplicationModule } from "./application.module";

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
        KafkaModule,
        IoTDevicePayloadDecoderDataTargetConnectionModule,
        IoTDeviceModule,
        DataTargetModule,
        PayloadDecoderModule,
        HttpModule,
        ApplicationModule,
    ],
    exports: [TypeOrmModule],
    controllers: [PayloadDecoderController],
    providers: [PayloadDecoderListenerService],
})
export class PayloadDecoderKafkaModule {}
