import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { IoTDevice } from "@entities/iot-device.entity";

/**
 * Represents an IoT device payload from a client
 */
export type CreateIoTDeviceMapDto = {
    /**
     * Client payload
     */
    iotDeviceDto: CreateIoTDeviceDto;
    /**
     * If an operation on the dto succeeds, this should be set
     */
    iotDevice?: IoTDevice;
    /**
     * If an operation on the dto fails, this should be set
     */
    error?: Omit<Error, "name">;
};
