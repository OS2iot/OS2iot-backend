import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { IoTDevice } from "@entities/iot-device.entity";

export type CreateIoTDeviceMapDto = {
    iotDeviceDto: CreateIoTDeviceDto;
    iotDevice?: IoTDevice;
    error?: Omit<Error, 'name'>;
};
