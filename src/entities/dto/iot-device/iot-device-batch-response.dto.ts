import { IoTDevice } from "@entities/iot-device.entity";

export class IotDeviceBatchResponseDto {
    data?: IoTDevice;
    error?: Omit<Error, 'name'>;
}
