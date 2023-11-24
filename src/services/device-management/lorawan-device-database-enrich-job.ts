import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";

@Injectable()
export class LorawanDeviceDatabaseEnrichJob {
    constructor(private chirpstackDeviceService: ChirpstackDeviceService, private iotDeviceService: IoTDeviceService) {}

    @Cron(CronExpression.EVERY_DAY_AT_5AM) // TODO: Finalize when to run
    async enrichLoRaWANDeviceDatabase() {
        // Select up to 25 lora devices without appId in the database
        const devices = await this.iotDeviceService.findNonEnrichedLoRaWANDevices();

        // Enrich from chirpstack
        const enrichedDevices = await Promise.all(
            devices.map(async device => await this.chirpstackDeviceService.enrichLoRaWANDevice(device))
        );

        // Save to database
        await this.iotDeviceService.updateLocalLoRaWANDevices(enrichedDevices);
    }
}
