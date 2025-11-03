import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { connect, MqttClient } from "mqtt";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { IoTDeviceType } from "@enum/device-type.enum";
import * as fs from "fs";
import { AuthenticationType } from "@enum/authentication-type.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { MQTTInternalBrokerDevice } from "@entities/mqtt-internal-broker-device.entity";
import { Repository } from "typeorm";
import { MQTTPermissionLevel } from "@enum/mqtt-permission-level.enum";
import { MqttService } from "@services/mqtt/mqtt.service";
import { caCertPath } from "@resources/resource-paths";

@Injectable()
export class InternalMqttBrokerListenerService implements OnApplicationBootstrap {
  passwordClient: MqttClient;
  private superUserName = "SuperUser";
  private superuserPassword = process.env.MQTT_SUPER_USER_PASSWORD || "SuperUser";
  private MQTT_URL = `mqtts://${process.env.MQTT_BROKER_HOSTNAME || "localhost"}`;
  private MQTT_PASSWORD_PORT = "8885";
  private readonly logger = new Logger(InternalMqttBrokerListenerService.name);
  private readonly MQTT_DEVICE_DATA_PREFIX = "devices/";
  private readonly MQTT_DEVICE_DATA_TOPIC = this.MQTT_DEVICE_DATA_PREFIX + "#";

  constructor(
    private receiveDataService: ReceiveDataService,
    private iotDeviceService: IoTDeviceService,
    private mqttService: MqttService,
    @InjectRepository(MQTTInternalBrokerDevice)
    private mqttInternalBrokerDeviceRepository: Repository<MQTTInternalBrokerDevice>
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    await this.seedSuperUser();
    const superUser = await this.iotDeviceService.getMqttSuperUser();
    const caCert = fs.readFileSync(caCertPath);
    this.passwordClient = connect(this.MQTT_URL, {
      clean: true,
      port: Number(this.MQTT_PASSWORD_PORT),
      clientId: "PasswordSuperUserClient",
      username: superUser.name,
      password: this.superuserPassword,
      ca: caCert,
    });

    this.configureClient(this.passwordClient);
  }

  private configureClient(client: MqttClient) {
    client.on("connect", () => {
      client.subscribe(this.MQTT_DEVICE_DATA_TOPIC);

      client.on("message", async (topic, message) => {
        this.logger.debug(`Received MQTT - Topic: '${topic}' - message: '${message}'`);

        if (topic.startsWith(this.MQTT_DEVICE_DATA_PREFIX)) {
          // Handle data coming in
          await this.handleMessage(message.toString(), topic);
        } else {
          this.logger.warn("Unknown MQTT Topic " + topic);
        }
      });

      this.logger.debug("Connected to MQTT Internal");
    });
  }

  private async handleMessage(message: string, topic: string) {
    const topicPath = topic.split("/");
    const deviceId = Number(topicPath[topicPath.length - 1]);
    const iotDevice = await this.iotDeviceService.findMQTTDevice(deviceId);

    if (iotDevice === undefined) {
      this.logger.warn(`Unknown DeviceId attempted to send data via MQTT DeviceId: ${deviceId}`);
      return;
    }

    await this.receiveDataService.sendRawIotDeviceRequestToKafka(
      iotDevice,
      message,
      IoTDeviceType.MQTTInternalBroker.toString()
    );
  }

  private async seedSuperUser() {
    if (await this.iotDeviceService.getMqttSuperUser()) {
      this.logger.debug("MQTT Listener superuser already exists. New one wont be seeded");
      return;
    }

    const certificateDetails = await this.mqttService.generateCertificate(this.superUserName);

    await this.mqttInternalBrokerDeviceRepository.save({
      type: IoTDeviceType.MQTTInternalBroker,
      applicationId: null,
      latitude: 0,
      longitude: 0,
      name: this.superUserName,
      authenticationType: AuthenticationType.PASSWORD,
      mqttpasswordhash: this.mqttService.hashPassword(this.superuserPassword),
      mqttusername: this.superUserName,
      permissions: MQTTPermissionLevel.superUser,
      deviceCertificate: certificateDetails.deviceCertificate,
      deviceCertificateKey: certificateDetails.deviceCertificateKey,
    });
    this.logger.log("Created MQTT Listener SuperUser");
  }
}
