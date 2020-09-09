import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { ApplicationController } from "@admin-controller/application.controller";
import { ApplicationService } from "@services/application.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { DataTarget } from "@entities/data-target.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { ReceivedMessage } from "@entities/received-message";
import { GenericHTTPDevice } from "../entities/generic-http-device.entity";
import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { Permission } from "@entities/permission.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Application,
            IoTDevice,
            GenericHTTPDevice,
            DataTarget,
            ReceivedMessage,
            ReceivedMessageMetadata,
            Organization,
            User,
            Permission,
            GlobalAdminPermission,
        ]),
        AuthModule,
    ],
    exports: [TypeOrmModule],
    controllers: [ApplicationController],
    providers: [ApplicationService],
})
export class ApplicationModule {}
