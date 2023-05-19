import { Injectable } from "@nestjs/common";
import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { AuthenticationType } from "@enum/authentication-type.enum";
import { EncryptionHelperService } from "@services/encryption-helper.service";
import { ActivationType } from "@enum/lorawan-activation-type.enum";

@Injectable()
export class CsvGeneratorService {
    constructor(private encryptionHelperService: EncryptionHelperService) {}
    public generateDeviceMetadataCsv(devices: IoTDevice[]) {
        const csvHeader = csvFields.join(",");
        let csvString = csvHeader + "\n";
        devices.forEach(device => {
            csvString +=
                this.generateCsvRow((device as unknown) as IotDeviceCsvDto) + "\n";
        });
        return csvString;
    }

    // Having device as any required due to fields originating from different types
    private generateCsvRow(device: any): string {
        const {
            name,
            type,
            location,
            commentOnLocation,
            comment,
            deviceModelId,
            apiKey,
            mqttURL,
            mqttPort,
            mqtttopicname,
            authenticationType,
            mqttusername,
            caCertificate,
            deviceCertificate,
            lorawanSettings,
        } = device;

        const mqttpassword = this.encryptionHelperService.basicDecrypt(
            device.mqttpassword
        );
        const deviceCertificateKey = this.encryptionHelperService.basicDecrypt(
            device.deviceCertificateKey
        );

        let csvRow =
            `${name},` +
            `,` +
            `${type},` +
            `${location.coordinates[1] ?? ""},` +
            `${location.coordinates[0] ?? ""},` +
            `${commentOnLocation ?? ""},` +
            `${comment ?? ""},` +
            `${deviceModelId ?? ""},` +
            `${apiKey ?? ""},` +
            `${mqttURL ?? ""},` +
            `${mqttPort ?? ""},` +
            `${mqtttopicname ?? ""},` +
            `${authenticationType ?? ""},` +
            `${mqttusername ?? ""},` +
            `${mqttpassword ?? ""},` +
            `${this.base64Encode(caCertificate) ?? ""},` +
            `${this.base64Encode(deviceCertificate) ?? ""},` +
            `${this.base64Encode(deviceCertificateKey) ?? ""},` +
            `${lorawanSettings?.devEUI ?? ""},` +
            `${lorawanSettings?.serviceProfileID ?? ""},` +
            `${lorawanSettings?.deviceProfileID ?? ""},` +
            `${lorawanSettings?.skipFCntCheck ?? ""},` +
            `${lorawanSettings?.activationType ?? ""},` +
            `${lorawanSettings?.OTAAapplicationKey ?? ""}`;

        return csvRow;
    }

    private base64Encode(input: string) {
        if (!input) {
            return undefined;
        }
        return Buffer.from(input, "binary").toString("base64");
    }
}

export class IotDeviceCsvDto {
    name: string;
    id: number;
    type: IoTDeviceType;
    latitude: number;
    longitude: number;
    commentOnLocation: string;
    comment: string;
    deviceModelId: number;
    apiKey: string;
    mqttURL: string;
    mqttPort: number;
    mqtttopic: string;
    authenticationType: AuthenticationType;
    mqttusername: string;
    mqttpassword: string;
    caCertificate: string;
    deviceCertificate: string;
    deviceCertificateKey: string;
    devEUI: string;
    serviceProfileId: number;
    deviceProfileId: number;
    skipFCntCheck: boolean;
    activationType: ActivationType;
    OTAAapplicationKey: string;
}

const csvFields = [
    "name",
    "id",
    "type",
    "latitude",
    "longitude",
    "commentOnLocation",
    "comment",
    "deviceModelId",
    "apiKey",
    "mqttURL",
    "mqttPort",
    "mqtttopicname",
    "authenticationType",
    "mqttusername",
    "mqttpassword",
    "caCertificate",
    "deviceCertificate",
    "deviceCertificateKey",
    "devEUI",
    "serviceProfileID",
    "deviceProfileID",
    "skipFCntCheck",
    "activationType",
    "OTAAapplicationKey",
];
