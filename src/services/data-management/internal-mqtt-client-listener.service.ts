import { forwardRef, Inject, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { connect, MqttClient } from "mqtt";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { MQTTExternalBrokerDevice } from "@entities/mqtt-external-broker-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { MqttClientId } from "@config/constants/mqtt-constants";
import { EncryptionHelperService } from "@services/encryption-helper.service";

@Injectable()
export class InternalMqttClientListenerService implements OnApplicationBootstrap {
  clientDictionary: Map<number, MqttClient>;
  private readonly logger = new Logger(InternalMqttClientListenerService.name);

  constructor(
    private receiveDataService: ReceiveDataService,
    @Inject(forwardRef(() => IoTDeviceService))
    private iotDeviceService: IoTDeviceService,
    private encryptionHelperService: EncryptionHelperService
  ) {
    this.clientDictionary = new Map<number, MqttClient>();
  }

  public async onApplicationBootstrap(): Promise<void> {
    // Get all subscriber devices
    const mqttSubscribers = await this.iotDeviceService.getAllValidMQTTExternalBrokers();

    // Create clients for each device
    this.createMQTTClients(mqttSubscribers.filter(d => !this.clientDictionary.has(d.id)));
  }

  public createMQTTClients(mqttSubscribers: MQTTExternalBrokerDevice[]) {
    mqttSubscribers.forEach(async d => {
      // Cannot create clients without a topic
      if (!d.mqtttopicname) {
        this.logger.error(`Something went wrong while connecting device ${d.name} removed client`);
        await this.iotDeviceService.markMqttExternalBrokerAsInvalid(d);
        return;
      }
      const client = connect(d.mqttURL, {
        clean: true,
        port: d.mqttPort,
        clientId: MqttClientId + ": " + d.name,
        username: d.mqttusername,
        password: this.encryptionHelperService.basicDecrypt(d.mqttpassword),
        cert: d.deviceCertificate,
        key: this.encryptionHelperService.basicDecrypt(d.deviceCertificateKey),
        ca: d.caCertificate,
        rejectUnauthorized: false,
      });
      this.setupClient(client, d);
      this.clientDictionary.set(d.id, client);
    });
  }

  public removeMQTTClient(mqttSubscriber: MQTTExternalBrokerDevice) {
    this.clientDictionary.get(mqttSubscriber.id)?.end(false, {}, () => this.clientDictionary.delete(mqttSubscriber.id));
    this.logger.debug(`Removed client for deviceId: ${mqttSubscriber.id}`);
  }

  private setupClient(client: MqttClient, device: MQTTExternalBrokerDevice) {
    client.on("connect", () => {
      client.subscribe(device.mqtttopicname);
      this.logger.debug(`Connected to ${device.mqttURL} for deviceId: ${device.id}`);

      client.on("message", async (topic, message) => {
        await this.handleMessage(message.toString(), device);
      });
    });
    client.on("end", async () => {
      await this.iotDeviceService.markMqttExternalBrokerAsInvalid(device);
      this.removeMQTTClient(device);
    });
  }

  private async handleMessage(message: string, device: MQTTExternalBrokerDevice) {
    await this.receiveDataService.sendRawIotDeviceRequestToKafka(
      device,
      message,
      IoTDeviceType.MQTTExternalBroker.toString()
    );
  }
}
