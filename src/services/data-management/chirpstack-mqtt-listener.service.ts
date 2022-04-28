import {
    ChirpstackMQTTConnectionStateMessageDto,
    ChirpstackMQTTMessageDto,
} from "@dto/chirpstack/chirpstack-mqtt-message.dto";
import { ChirpstackMQTTConnectionStateMessage } from "@dto/chirpstack/state/chirpstack-mqtt-state-message.dto";
import { IoTDeviceType } from "@enum/device-type.enum";
import { hasProps, nameof } from "@helpers/type-helper";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ChirpstackStateTemplatePath } from "@resources/resource-paths";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import * as mqtt from "mqtt";
import { Client } from "mqtt";
import * as Protobuf from "protobufjs";

@Injectable()
export class ChirpstackMQTTListenerService implements OnApplicationBootstrap {
    constructor(
        private receiveDataService: ReceiveDataService,
        private iotDeviceService: IoTDeviceService
    ) {
        const connStateFullTemplate = Protobuf.loadSync(ChirpstackStateTemplatePath);
        this.connStateType = connStateFullTemplate.lookupType("ConnState");
    }

    private readonly logger = new Logger(ChirpstackMQTTListenerService.name);
    private readonly connStateType: Protobuf.Type;

    MQTT_CLIENT_ID = "os2iot-backend";
    MQTT_URL = `mqtt://${process.env.CS_MQTT_HOSTNAME || "localhost"}:${
        process.env.CS_MQTT_PORT || "1883"
    }`;
    client: Client;

    private readonly CHIRPSTACK_MQTT_DEVICE_DATA_PREFIX = "application/";
    private readonly CHIRPSTACK_MQTT_DEVICE_DATA_TOPIC =
        this.CHIRPSTACK_MQTT_DEVICE_DATA_PREFIX + "+/device/+/event/up";
    private readonly CHIRPSTACK_MQTT_GATEWAY_PREFIX = "gateway/";
    private readonly CHIRPSTACK_MQTT_GATEWAY_TOPIC =
        this.CHIRPSTACK_MQTT_GATEWAY_PREFIX + "+/state/conn";

    public async onApplicationBootstrap(): Promise<void> {
        this.logger.debug("Pre-init");

        this.client = mqtt.connect(this.MQTT_URL, {
            clean: true,
            clientId: this.MQTT_CLIENT_ID,
        });
        this.client.on("connect", () => {
            this.client.subscribe(this.CHIRPSTACK_MQTT_DEVICE_DATA_TOPIC);
            this.client.subscribe(this.CHIRPSTACK_MQTT_GATEWAY_TOPIC);

            this.client.on("message", async (topic, message) => {
                this.logger.debug(
                    `Received MQTT - Topic: '${topic}' - message: '${message}'`
                );

                if (topic.startsWith(this.CHIRPSTACK_MQTT_DEVICE_DATA_PREFIX)) {
                    await this.receiveMqttMessage(message.toString());
                } else if (topic.startsWith(this.CHIRPSTACK_MQTT_GATEWAY_PREFIX)) {
                    try {
                        const decoded = this.connStateType.decode(message);
                        // TODO: GATEWAY-STATUS: Remove log
                        console.log(
                            "Received gateway topic! Data is ",
                            message.toString(),
                            decoded.toJSON()
                        );

                        await this.receiveMqttGatewayStatusMessage(decoded.toJSON());
                    } catch (error) {
                        // TODO: GATEWAY-STATUS:  Add error handling/logging
                    }
                } else {
                    this.logger.warn("Unrecognized MQTT topic " + topic);
                }
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

        await this.receiveDataService.sendRawIotDeviceRequestToKafka(
            iotDevice,
            message,
            IoTDeviceType.LoRaWAN.toString()
        );
    }

    async receiveMqttGatewayStatusMessage(
        message: Record<string, unknown>
    ): Promise<void> {
        if (
            message &&
            hasProps(
                message,
                nameof<ChirpstackMQTTConnectionStateMessage>("gatewayId")
            ) &&
            typeof message.gatewayId === "string"
        ) {
            const dto: ChirpstackMQTTConnectionStateMessageDto = {
                gatewayId: Buffer.from(message.gatewayId, "base64").toString("hex"),
                isOnline: message.state === "ONLINE",
            };
            const jsonDto = JSON.stringify(dto);

            await this.receiveDataService.sendRawGatewayStateToKafka(
                dto.gatewayId,
                jsonDto
            );
        } else {
            // TODO: Error handling
        }
    }
}
