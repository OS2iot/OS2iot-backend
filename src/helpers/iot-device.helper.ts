import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { IotDeviceBatchResponseDto } from "@dto/iot-device/iot-device-batch-response.dto";
import { UpdateIoTDeviceBatchDto } from "@dto/iot-device/update-iot-device-batch.dto";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { SigFoxDeviceWithBackendDataDto } from "@dto/sigfox-device-with-backend-data.dto";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { checkIfUserHasWriteAccessToApplication } from "./security-helper";

/**
 * Iterate through the devices once, splitting it into a tuple with the data we want to log
 * @param response
 */
export function buildIoTDeviceCreateUpdateAuditData(
    response: IotDeviceBatchResponseDto[]
): { deviceIds: number[]; deviceNames: string[] } {
    return response.reduce(
        (res: { deviceIds: number[]; deviceNames: string[] }, device) => {
            if (!device.data || device.error) {
                return res;
            }
            device.data.id && res.deviceIds.push(device.data.id);
            device.data.name && res.deviceNames.push(device.data.name);
            return res;
        },
        { deviceIds: [], deviceNames: [] }
    );
}

export function ensureUpdatePayload(
    validDevices: UpdateIoTDeviceBatchDto,
    oldIotDevices: (
        | IoTDevice
        | LoRaWANDeviceWithChirpstackDataDto
        | SigFoxDeviceWithBackendDataDto
    )[],
    devicesNotFound: IotDeviceBatchResponseDto[],
    req: AuthenticatedRequest
): (
    previousValue: UpdateIoTDeviceDto[],
    currentValue: UpdateIoTDeviceDto,
    currentIndex: number,
    array: UpdateIoTDeviceDto[]
) => UpdateIoTDeviceDto[] {
    return (res: typeof validDevices["data"], updateDeviceDto) => {
        const oldDevice = oldIotDevices.find(
            oldDevice => oldDevice.id === updateDeviceDto.id
        );

        if (!oldDevice) {
            devicesNotFound.push({
                idMetadata: {
                    applicationId: updateDeviceDto.applicationId,
                    name: updateDeviceDto.name,
                },
                error: {
                    message: ErrorCodes.IdDoesNotExists,
                },
            });
            return res;
        }

        checkIfUserHasWriteAccessToApplication(req, oldDevice.application.id);

        if (updateDeviceDto.applicationId !== oldDevice.application.id) {
            // New application
            checkIfUserHasWriteAccessToApplication(req, updateDeviceDto.applicationId);
        }
        res.push(updateDeviceDto);
        return res;
    };
}
