import { Injectable } from "@nestjs/common";
import { IoTDevice } from "@entities/iot-device.entity";
import { EncryptionHelperService } from "@services/encryption-helper.service";

@Injectable()
export class CsvGeneratorService {
  constructor(private encryptionHelperService: EncryptionHelperService) {}
  public generateDeviceMetadataCsv(devices: IoTDevice[]) {
    const csvHeader = csvFields.join(",");
    let csvString = csvHeader + "\n";
    devices.forEach(device => {
      csvString += this.generateCsvRow(device) + "\n";
    });
    return csvString;
  }

  // Having device as any required due to fields originating from different types
  private generateCsvRow(device: any): string {
    const {
      name,
      id,
      type,
      location,
      commentOnLocation,
      comment,
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

    const mqttpassword = this.encryptionHelperService.basicDecrypt(device.mqttpassword);
    const deviceCertificateKey = this.encryptionHelperService.basicDecrypt(device.deviceCertificateKey);

    let csvRow =
      `${name},` +
      `${id},` +
      `${type},` +
      `${location?.coordinates[1] ?? ""},` +
      `${location?.coordinates[0] ?? ""},` +
      `${commentOnLocation ?? ""},` +
      `${comment ?? ""},` +
      `${device.deviceModel?.id ?? ""},` +
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
  "deviceProfileID",
  "skipFCntCheck",
  "activationType",
  "OTAAapplicationKey",
];
