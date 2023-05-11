import { Injectable } from "@nestjs/common";
import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { Point } from "geojson";
import { AuthenticationType } from "@enum/authentication-type.enum";
import { forEach } from "lodash";
import { EncryptionHelperService } from "@services/encryption-helper.service";

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
            apiKey,
            deviceEUI,
            downlinkPayload,
            mqttURL,
            mqttPort,
            mqtttopic,
            authenticationType,
            mqttusername,
            caCertificate,
            deviceCertificate,
        } = device;

        const mqttpassword = this.encryptionHelperService.basicDecrypt(
            device.mqttpassword
        );
        const deviceCertificateKey = this.encryptionHelperService.basicDecrypt(
            device.deviceCertificateKey
        );

        let csvRow = `${name},${type},${location.coordinates[1]},${
            location.coordinates[0]
        },${apiKey ?? ""},${deviceEUI ?? ""},${downlinkPayload ?? ""},${mqttURL ?? ""},${
            mqttPort ?? ""
        },${mqtttopic ?? ""},${authenticationType ?? ""},${mqttusername ?? ""},${
            mqttpassword ?? ""
        },${this.base64Encode(caCertificate) ?? ""},${
            this.base64Encode(deviceCertificate) ?? ""
        },${this.base64Encode(deviceCertificateKey) ?? ""}`;

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
    type: IoTDeviceType;
    latitude: number;
    longitude: number;
    apiKey: string;
    deviceEUI: string;
    downlinkPayload: string;
    mqttURL: string;
    mqttPort: number;
    mqtttopic: string;
    authenticationType: AuthenticationType;
    mqttusername: string;
    mqttpassword: string;
    caCertificate: string;
    deviceCertificate: string;
    deviceCertificateKey: string;
}

const csvFields = [
    "name",
    "type",
    "latitude",
    "longitude",
    "apiKey",
    "deviceEUI",
    "downlinkPayload",
    "mqttURL",
    "mqttPort",
    "mqtttopic",
    "authenticationType",
    "mqttusername",
    "mqttpassword",
    "caCertificate",
    "deviceCertificate",
    "deviceCertificateKey",
];
