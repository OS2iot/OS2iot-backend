import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { SharedModule } from "@modules/shared.module";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { DeviceIntegrationPersistenceService } from "@services/data-management/device-integration-persistence.service";

@Module({
  imports: [SharedModule, IoTDeviceModule, HttpModule],
  providers: [DeviceIntegrationPersistenceService],
})
export class DeviceIntegrationPersistenceModule {}
