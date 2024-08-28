import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { CreateIoTDeviceMapDto } from "@dto/iot-device/create-iot-device-map.dto";
import { IotDeviceBatchResponseDto } from "@dto/iot-device/iot-device-batch-response.dto";
import { UpdateIoTDeviceBatchDto } from "@dto/iot-device/update-iot-device-batch.dto";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { SigFoxDeviceWithBackendDataDto } from "@dto/sigfox-device-with-backend-data.dto";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ApplicationAccessScope, checkIfUserHasAccessToApplication } from "./security-helper";
import { CreateMqttExternalBrokerSettingsDto } from "@dto/create-mqtt-external-broker-settings.dto";
import { AuthenticationType } from "@enum/authentication-type.enum";
import { CreateMqttInternalBrokerSettingsDto } from "@dto/create-mqtt-internal-broker-settings.dto";

/**
 * Iterate through the devices once, splitting it into a tuple with the data we want to log
 * @param response
 */
export function buildIoTDeviceCreateUpdateAuditData(response: IotDeviceBatchResponseDto[]): {
  deviceIds: number[];
  deviceNames: string[];
} {
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
  oldIotDevices: (IoTDevice | LoRaWANDeviceWithChirpstackDataDto | SigFoxDeviceWithBackendDataDto)[],
  devicesNotFound: IotDeviceBatchResponseDto[],
  req: AuthenticatedRequest
): (
  previousValue: UpdateIoTDeviceDto[],
  currentValue: UpdateIoTDeviceDto,
  currentIndex: number,
  array: UpdateIoTDeviceDto[]
) => UpdateIoTDeviceDto[] {
  return (res: (typeof validDevices)["data"], updateDeviceDto) => {
    const oldDevice = oldIotDevices.find(oldDevice => oldDevice.id === updateDeviceDto.id);

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

    checkIfUserHasAccessToApplication(req, oldDevice.application.id, ApplicationAccessScope.Write);

    if (updateDeviceDto.applicationId !== oldDevice.application.id) {
      // New application
      checkIfUserHasAccessToApplication(req, updateDeviceDto.applicationId, ApplicationAccessScope.Write);
    }
    res.push(updateDeviceDto);
    return res;
  };
}

export function isValidIoTDeviceMap(iotDeviceMap: CreateIoTDeviceMapDto): boolean {
  return !iotDeviceMap.error && !!iotDeviceMap.iotDevice;
}

export function filterValidIotDeviceMaps(iotDeviceMap: CreateIoTDeviceMapDto[]): CreateIoTDeviceMapDto[] {
  return iotDeviceMap.filter(map => !map.error && map.iotDevice);
}

/**
 * @param dbIotDevices
 * @returns A new list of processed and failed devices
 */
export function mapAllDevicesByProcessed(dbIotDevices: IoTDevice[]): (
  value: CreateIoTDeviceMapDto,
  index: number,
  array: CreateIoTDeviceMapDto[]
) => {
  data: IoTDevice;
  idMetadata: { name: string; applicationId: number };
  error: Omit<Error, "name">;
} {
  return iotDeviceMap => ({
    data: dbIotDevices.find(dbDevice => dbDevice.id === iotDeviceMap.iotDevice?.id),
    idMetadata: {
      name: iotDeviceMap.iotDeviceDto.name,
      applicationId: iotDeviceMap.iotDeviceDto.applicationId,
    },
    error: iotDeviceMap.error,
  });
}

export function validateMQTTInternalBroker(settings: CreateMqttInternalBrokerSettingsDto) {
  if (settings.authenticationType === undefined) {
    throw new Error("Autentifikationstype er påkrevet");
  }
  if (
    settings.authenticationType === AuthenticationType.PASSWORD &&
    (settings.mqttpassword === undefined || settings.mqttusername === undefined)
  ) {
    throw new Error("Brugernavn eller kodeord er ikke sat");
  }
}

export function validateMQTTExternalBroker(settings: CreateMqttExternalBrokerSettingsDto) {
  if (
    settings.mqtttopicname === undefined ||
    settings.mqttURL === undefined ||
    settings.mqttPort === undefined ||
    settings.authenticationType === undefined
  ) {
    throw new Error("Påkrævede felter til mqtt forbindelsen ikke sat korrekt");
  }

  if (
    settings.authenticationType === AuthenticationType.PASSWORD &&
    (settings.mqttpassword === undefined || settings.mqttusername === undefined)
  ) {
    throw new Error("Brugernavn eller kodeord er ikke sat");
  }

  if (
    settings.authenticationType === AuthenticationType.CERTIFICATE &&
    (settings.caCertificate === undefined ||
      settings.deviceCertificate === undefined ||
      settings.deviceCertificateKey === undefined)
  ) {
    throw new Error("Et certifikat er ikke sat");
  }
  if (settings.mqttPort < 0 || settings.mqttPort > 65535) {
    throw new Error("Port skal være mellem 0 og 65535");
  }
}
