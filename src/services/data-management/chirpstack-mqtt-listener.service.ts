import { MqttClientId } from "@config/constants/mqtt-constants";
import {
  ChirpstackMqttAckMessageDto,
  ChirpstackMqttConnectionStateMessageDto,
  ChirpstackMqttMessageDto,
  ChirpstackMqttTxAckMessageDto,
} from "@dto/chirpstack/chirpstack-mqtt-message.dto";
import { ChirpstackMQTTConnectionStateMessage } from "@dto/chirpstack/state/chirpstack-mqtt-state-message.dto";
import { IoTDeviceType } from "@enum/device-type.enum";
import { hasProps, nameof } from "@helpers/type-helper";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ChirpstackStateTemplatePath } from "@resources/resource-paths";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { IoTDeviceDownlinkService } from "@services/device-management/iot-device-downlink.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import mqtt, { MqttClient } from "mqtt";
import * as Protobuf from "protobufjs";

@Injectable()
export class ChirpstackMQTTListenerService implements OnApplicationBootstrap {
  MQTT_URL = `mqtt://${process.env.CS_MQTT_HOSTNAME || "localhost"}:${process.env.CS_MQTT_PORT || "1883"}`;
  client: MqttClient;
  private readonly logger = new Logger(ChirpstackMQTTListenerService.name);
  private readonly connStateType: Protobuf.Type;
  private readonly CHIRPSTACK_MQTT_DEVICE_DATA_PREFIX = "application/";
  private readonly CHIRPSTACK_MQTT_DEVICE_DATA_TOPIC = this.CHIRPSTACK_MQTT_DEVICE_DATA_PREFIX + "+/device/+/event/up";
  private readonly CHIRPSTACK_MQTT_DEVICE_DATA_TXACK_TOPIC =
    this.CHIRPSTACK_MQTT_DEVICE_DATA_PREFIX + "+/device/+/event/txack";
  private readonly CHIRPSTACK_MQTT_DEVICE_DATA_TXACK_POSTFIX = "/txack";
  private readonly CHIRPSTACK_MQTT_DEVICE_DATA_ACK_TOPIC =
    this.CHIRPSTACK_MQTT_DEVICE_DATA_PREFIX + "+/device/+/event/ack";
  private readonly CHIRPSTACK_MQTT_DEVICE_DATA_ACK_POSTFIX = "/ack";
  private readonly CHIRPSTACK_MQTT_GATEWAY_PREFIX = "gateway/";
  private readonly CHIRPSTACK_MQTT_GATEWAY_TOPIC = this.CHIRPSTACK_MQTT_GATEWAY_PREFIX + "+/state/conn";

  constructor(
    private receiveDataService: ReceiveDataService,
    private iotDeviceService: IoTDeviceService,
    private downlinkService: IoTDeviceDownlinkService
  ) {
    const connStateFullTemplate = Protobuf.loadSync(ChirpstackStateTemplatePath);
    this.connStateType = connStateFullTemplate.lookupType("ConnState");
  }

  public async onApplicationBootstrap(): Promise<void> {
    this.logger.debug("Pre-init");

    this.client = mqtt.connect(this.MQTT_URL, {
      clean: true,
      clientId: MqttClientId,
    });
    this.client.on("connect", () => {
      this.client.subscribe(this.CHIRPSTACK_MQTT_DEVICE_DATA_TOPIC);
      this.client.subscribe(this.CHIRPSTACK_MQTT_GATEWAY_TOPIC);
      this.client.subscribe(this.CHIRPSTACK_MQTT_DEVICE_DATA_TXACK_TOPIC);
      this.client.subscribe(this.CHIRPSTACK_MQTT_DEVICE_DATA_ACK_TOPIC);

      this.client.on("message", async (topic, message) => {
        this.logger.debug(`Received MQTT - Topic: '${topic}' - message: '${message}'`);

        if (topic.startsWith(this.CHIRPSTACK_MQTT_DEVICE_DATA_PREFIX)) {
          if (topic.endsWith(this.CHIRPSTACK_MQTT_DEVICE_DATA_TXACK_POSTFIX)) {
            try {
              await this.receiveMqttTxAckMessage(message.toString());
            } catch (error) {
              this.logger.error(`Received TxAckError. Error: ${error}`);
            }
          } else if (topic.endsWith(this.CHIRPSTACK_MQTT_DEVICE_DATA_ACK_POSTFIX)) {
            try {
              await this.receiveMqttAckMessage(message.toString());
            } catch (error) {
              this.logger.error(`Received TxAckError. Error: ${error}`);
            }
          } else await this.receiveMqttMessage(message.toString());
        } else if (topic.startsWith(this.CHIRPSTACK_MQTT_GATEWAY_PREFIX)) {
          try {
            const decoded = this.connStateType.decode(message);
            await this.receiveMqttGatewayStatusMessage(decoded.toJSON());
          } catch (error) {
            this.logger.error(`Gateway status data could not be processed. Error: ${error}`);
          }
        } else {
          this.logger.warn("Unrecognized MQTT topic " + topic);
        }
      });
      this.logger.debug("Connected to MQTT.");
    });
  }

  async receiveMqttMessage(message: string): Promise<void> {
    const dto: ChirpstackMqttMessageDto = JSON.parse(message);
    const iotDevice = await this.iotDeviceService.findLoRaWANDeviceByDeviceEUI(dto.deviceInfo.devEui);

    if (!iotDevice) {
      this.logger.warn(
        `Chirpstack sent MQTT message for devEUI ${dto.deviceInfo.devEui}, but that's not registered in OS2IoT`
      );
      return;
    }

    await this.receiveDataService.sendRawIotDeviceRequestToKafka(iotDevice, message, IoTDeviceType.LoRaWAN.toString());
  }

  async receiveMqttTxAckMessage(message: string): Promise<void> {
    const dto: ChirpstackMqttTxAckMessageDto = JSON.parse(message);
    const iotDevice = await this.iotDeviceService.findLoRaWANDeviceByDeviceEUI(dto.deviceInfo.devEui);

    if (!iotDevice) {
      this.logger.warn(
        `Chirpstack sent downlink message to devEUI ${dto.deviceInfo.devEui}, but that's not registered in OS2IoT`
      );
      return;
    }
    return this.downlinkService.updateTxAckDownlink(dto);
  }

  async receiveMqttAckMessage(message: string): Promise<void> {
    const dto: ChirpstackMqttAckMessageDto = JSON.parse(message);
    const iotDevice = await this.iotDeviceService.findLoRaWANDeviceByDeviceEUI(dto.deviceInfo.devEui);

    if (!iotDevice) {
      this.logger.warn(
        `Chirpstack sent downlink message to devEUI ${dto.deviceInfo.devEui}, but that's not registered in OS2IoT`
      );
      return;
    }
    return this.downlinkService.updateAckDownlink(dto);
  }

  async receiveMqttGatewayStatusMessage(message: Record<string, unknown>): Promise<void> {
    if (
      (hasProps(message, nameof<ChirpstackMQTTConnectionStateMessage>("gatewayId")) ||
        hasProps(message, nameof<ChirpstackMQTTConnectionStateMessage>("gatewayIdLegacy"))) &&
      (typeof message.gatewayId === "string" || typeof message.gatewayIdLegacy === "string")
    ) {
      const dto: ChirpstackMqttConnectionStateMessageDto = {
        gatewayId: message.gatewayId
          ? message.gatewayId.toString()
          : message.gatewayIdLegacy
          ? Buffer.from(message.gatewayIdLegacy.toString(), "base64").toString("hex")
          : undefined,
        isOnline: message.state === "ONLINE",
      };

      if (!dto.gatewayId) {
        this.logger.error(
          `Gateway status message is not properly formatted. Gateway id, if any, is ${
            message?.gatewayId
              ? message?.gatewayId
              : Buffer.from(message.gatewayIdLegacy as any, "base64").toString("hex")
          }`
        );
        return;
      }

      const jsonDto = JSON.stringify(dto);

      await this.receiveDataService.sendRawGatewayStateToKafka(dto.gatewayId, jsonDto);
    } else {
      this.logger.error(
        `Gateway status message is not properly formatted. Gateway id, if any, is ${
          message?.gatewayId
            ? message?.gatewayId
            : Buffer.from(message.gatewayIdLegacy as any, "base64").toString("hex")
        }`
      );
    }
  }
}
