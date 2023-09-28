import { DataTargetController } from "@admin-controller/data-target.controller";
import configuration from "@config/configuration";
import { ApplicationModule } from "@modules/device-management/application.module";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { OS2IoTMail } from "@services/os2iot-mail.service";
import {
    CLIENT_SECRET_PROVIDER,
    PlainTextClientSecretProvider,
} from "../../helpers/fiware-token.helper";

@Module({
    imports: [
        SharedModule,
        forwardRef(() => ApplicationModule),
        OrganizationModule,
        ConfigModule.forRoot({ load: [configuration] }),
    ],
    exports: [DataTargetService],
    controllers: [DataTargetController],
    providers: [
        DataTargetService,
        OS2IoTMail,
        {
            provide: CLIENT_SECRET_PROVIDER,
            useClass: PlainTextClientSecretProvider,
        },
    ],
})
export class DataTargetModule {}
