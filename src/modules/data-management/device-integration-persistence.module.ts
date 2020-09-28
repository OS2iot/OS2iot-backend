import { Module, HttpModule } from "@nestjs/common";

import { DeviceIntegrationPersistenceService } from "@services/data-management/device-integration-persistence.service";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, IoTDeviceModule, HttpModule],
    providers: [DeviceIntegrationPersistenceService],
})
export class DeviceIntegrationPersistenceModule {}
