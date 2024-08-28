import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { SharedModule } from "@modules/shared.module";
import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { MulticastController } from "../../controllers/admin-controller/multicast.controller";
import { MulticastService } from "../../services/chirpstack/multicast.service";
import { ApplicationModule } from "./application.module";
import { IoTDeviceModule } from "./iot-device.module";

@Module({
  imports: [
    SharedModule,
    forwardRef(() => ApplicationModule), // because of circular reference
    HttpModule,
    ChirpstackAdministrationModule,
    IoTDeviceModule,
  ],
  exports: [MulticastService],
  controllers: [MulticastController],
  providers: [MulticastService],
})
export class MulticastModule {}
