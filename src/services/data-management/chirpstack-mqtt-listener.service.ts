import { Client } from "mqtt";
import * as mqtt from "mqtt";
import { Injectable, OnApplicationBootstrap, Logger } from "@nestjs/common";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { IoTDeviceService } from "@services/iot-device.service";
import { ChirpstackMQTTMessageDto } from "@dto/chirpstack/chirpstack-mqtt-message.dto";

@Injectable()
export class ChirpstackMQTTListenerService implements OnApplicationBootstrap {
    constructor(
        private receiveDataService: ReceiveDataService,
        private iotDeviceService: IoTDeviceService
    ) {}

    private readonly logger = new Logger(ChirpstackMQTTListenerService.name);

    MQTT_CLIENT_ID = "os2iot-backend";
    MQTT_URL = "mqtt://localhost:1883";
    client: Client;

    public async onApplicationBootstrap(): Promise<void> {
        this.logger.debug("Pre-init");
        this.client = mqtt.connect(this.MQTT_URL, {
            clean: true,
            clientId: this.MQTT_CLIENT_ID,
        });
        this.client.on("connect", () => {
            Logger.debug("Connect to MQTT.");
            this.client.subscribe("application/+/device/+/event/up");

            this.client.on("message", async (topic, message) => {
                this.logger.debug(
                    `Received MQTT - Topic: '${topic}' - message: '${message}'`
                );
                await this.receiveMqttMessage(message.toString());
            });
            this.logger.debug("Initialized.");
        });
    }

    async receiveMqttMessage(message: string): Promise<void> {
        const dto: ChirpstackMQTTMessageDto = JSON.parse(message);
        const iotDevice = await this.iotDeviceService.findLoRaWANDeviceByDeviceEUI(
            dto.devEUI
        );

        if (!iotDevice) {
            this.logger.warn(
                `Chirpstack sent MQTT message for devEUI ${dto.devEUI}, but that's not registered in OS2IoT`
            );
            return;
        }

        await this.receiveDataService.sendToKafka(iotDevice, message);
    }
}
