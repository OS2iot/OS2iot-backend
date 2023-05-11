import { Injectable } from "@nestjs/common";
import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { Point } from "geojson";

@Injectable()
export class CsvGeneratorService {
    public generateDeviceMetadataCsv(devices: IoTDevice[]) {
        const first = (devices[0] as unknown) as iotDeviceCsvDto;
        const csvHeader = Object.keys(first).join(",");
        let csvString = csvHeader + "\n";
        devices.forEach(device => {
            csvString += this.generateCsvRow(device);
        });
        return csvString;
    }

    private generateCsvRow(device: IoTDevice): string {
        let csvRow = "";
        const entries = Object.entries(device);
        entries.forEach(entry => {
            switch (entry[0]) {
                case "createdAt":
                case "updatedAt":
                    csvRow += (entry[1] as Date).toLocaleString() + ",";
                    break;
                case "location":
                    csvRow += entry[1] as Point;
                    break;
                default:
                    csvRow += entry[1] + ",";
            }
        });

        return csvRow;
    }
}

export interface iotDeviceCsvDto {
    name: string;
    type: IoTDeviceType;
    deviceEUI: string;
}
