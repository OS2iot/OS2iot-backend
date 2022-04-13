import { MqttClientId } from "@config/constants/mqtt-constants";
import { ChirpstackMQTTMessageDto } from "@dto/chirpstack/chirpstack-mqtt-message.dto";
import { IoTDeviceType } from "@enum/device-type.enum";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import * as mqtt from "mqtt";
import { Client } from "mqtt";

@Injectable()
export class ChirpstackMQTTListenerService implements OnApplicationBootstrap {
    constructor(
        private receiveDataService: ReceiveDataService,
        private iotDeviceService: IoTDeviceService
    ) {}

    private readonly logger = new Logger(ChirpstackMQTTListenerService.name);

    MQTT_URL = `mqtt://${process.env.CS_MQTT_HOSTNAME || "localhost"}:${
        process.env.CS_MQTT_PORT || "1883"
    }`;
    client: Client;

    private readonly CHIRPSTACK_MQTT_DEVICE_DATA_TOPIC =
        "application/+/device/+/event/up";

    public async onApplicationBootstrap(): Promise<void> {
        this.logger.debug("Pre-init");
        this.client = mqtt.connect(this.MQTT_URL, {
            clean: true,
            clientId: MqttClientId,
        });
        this.client.on("connect", () => {
            this.client.subscribe(this.CHIRPSTACK_MQTT_DEVICE_DATA_TOPIC);

            this.client.on("message", async (topic, message) => {
                this.logger.debug(
                    `Received MQTT - Topic: '${topic}' - message: '${message}'`
                );
                await this.receiveMqttMessage(message.toString());
            });
            this.logger.debug("Connected to MQTT.");
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

        await this.receiveDataService.sendToKafka(
            iotDevice,
            message,
            IoTDeviceType.LoRaWAN.toString()
        );
    }
}
