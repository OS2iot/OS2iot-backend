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
import { DataTargetSenderService } from "@services/data-targets/data-target-sender.service";
import { DataTargetFiwareSenderModule } from "@modules/data-target/data-target-fiware-sender.module";
import { DataTargetSenderModule } from "@modules/data-target/data-target-sender.module";
import { PayloadDecoderExecutorModuleModule } from "@modules/payload-decoder-executor-module.module";
import { PayloadDecoderModule } from "@modules/device-management/payload-decoder.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";

@Module({
  imports: [
    SharedModule,
    forwardRef(() => ApplicationModule),
    OrganizationModule,
    ConfigModule.forRoot({ load: [configuration] }),
    DataTargetFiwareSenderModule,
    DataTargetSenderModule,
    forwardRef(() => PayloadDecoderModule),
    forwardRef(() => IoTDeviceModule),
    PayloadDecoderExecutorModuleModule,
  ],
  exports: [DataTargetService, DataTargetLogService, DataTargetSenderService],
  controllers: [DataTargetController, DatatargetLogController],
  providers: [
    DataTargetService,
    DataTargetLogService,
    DataTargetSenderService,
    OS2IoTMail,
    {
      provide: CLIENT_SECRET_PROVIDER,
      useClass: PlainTextClientSecretProvider,
    },
  ],
})
export class DataTargetModule {}
