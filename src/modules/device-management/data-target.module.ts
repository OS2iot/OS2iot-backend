import { DatatargetLogController } from "@admin-controller/data-target-log.controller";
import { DataTargetController } from "@admin-controller/data-target.controller";
import configuration from "@config/configuration";
import { ApplicationModule } from "@modules/device-management/application.module";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { OS2IoTMail } from "@services/os2iot-mail.service";
import { CLIENT_SECRET_PROVIDER, PlainTextClientSecretProvider } from "../../helpers/fiware-token.helper";
import { DataTargetLogService } from "@services/data-targets/data-target-log.service";

@Module({
  imports: [
    SharedModule,
    forwardRef(() => ApplicationModule),
    OrganizationModule,
    ConfigModule.forRoot({ load: [configuration] }),
  ],
  exports: [DataTargetService, DataTargetLogService],
  controllers: [DataTargetController, DatatargetLogController],
  providers: [
    DataTargetService,
    DataTargetLogService,
    OS2IoTMail,
    {
      provide: CLIENT_SECRET_PROVIDER,
      useClass: PlainTextClientSecretProvider,
    },
  ],
})
export class DataTargetModule {}
