import { IoTDevice } from "@entities/iot-device.entity";

export class IotDeviceBatchResponseDto {
    data?: IoTDevice;
    /**
     * Identification metadata about the payload in case it was not valid
     */
    idMetadata: {
        name: string;
        applicationId: number;
    };
    error?: Omit<Error, "name">;
}
