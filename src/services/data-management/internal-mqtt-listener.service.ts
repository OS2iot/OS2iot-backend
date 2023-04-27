import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { Client, connect } from "mqtt";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { IoTDeviceType } from "@enum/device-type.enum";

@Injectable()
export class InternalMqttListenerService implements OnApplicationBootstrap {
    constructor(
        private receiveDataService: ReceiveDataService,
        private iotDeviceService: IoTDeviceService
    ) {}

    // TODO two clients needed?
    private MQTT_URL = `mqtt://${process.env.MQTT_BROKER_HOSTNAME || "localhost"}:${
        process.env.MQTT_BROKER_PASSWORD_PORT || "8884"
    }`;
    client: Client;

    private readonly logger = new Logger(InternalMqttListenerService.name);

    private readonly MQTT_DEVICE_DATA_PREFIX = "devices/";
    private readonly MQTT_DEVICE_DATA_TOPIC = this.MQTT_DEVICE_DATA_PREFIX + "#";

    public async onApplicationBootstrap(): Promise<void> {
        this.client = connect(this.MQTT_URL, {
            clean: true,
            clientId: "globaladminsupermasteroftheuniverse",
        });

        this.client.on("connect", () => {
            this.client.subscribe(this.MQTT_DEVICE_DATA_TOPIC);

            this.client.on("message", async (topic, message) => {
                if (topic.startsWith(this.MQTT_DEVICE_DATA_PREFIX)) {
                    // Handle data coming in
                    await this.handleMessage(message.toString(), topic);
                } else {
                    this.logger.warn("Unknown MQTT Topic " + topic);
                }
            });
        });
    }

    private async handleMessage(message: string, topic: string) {
        const topicPath = topic.split("/");
        const deviceId = Number(topicPath[topicPath.length - 1]);
        const iotDevice = await this.iotDeviceService.findMQTTDevice(deviceId);

        if (iotDevice === undefined) {
            this.logger.warn(
                `Unknown DeviceId attempted to send data via MQTT DeviceId: ${deviceId}`
            );
            return;
        }

        await this.receiveDataService.sendRawIotDeviceRequestToKafka(
            iotDevice,
            message,
            IoTDeviceType.MQTTBroker.toString()
        );
    }
}
