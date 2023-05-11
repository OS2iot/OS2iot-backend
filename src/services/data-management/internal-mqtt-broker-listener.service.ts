import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { Client, connect } from "mqtt";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { IoTDeviceType } from "@enum/device-type.enum";
import * as fs from "fs";
import { AuthenticationType } from "@enum/authentication-type.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { MQTTBrokerDevice } from "@entities/mqtt-broker-device.entity";
import { Repository } from "typeorm";
import { MQTTPermissionLevel } from "@enum/mqtt-permission-level.enum";
import { MqttService } from "@services/mqtt/mqtt.service";
import { caCertPath } from "@resources/resource-paths";

@Injectable()
export class InternalMqttBrokerListenerService implements OnApplicationBootstrap {
    constructor(
        private receiveDataService: ReceiveDataService,
        private iotDeviceService: IoTDeviceService,
        private mqttService: MqttService,
        @InjectRepository(MQTTBrokerDevice)
        private mqttBrokerDeviceRepository: Repository<MQTTBrokerDevice>
    ) {}

    private MQTT_URL = `mqtts://${process.env.MQTT_BROKER_HOSTNAME || "localhost"}`;
    private MQTT_PASSWORD_PORT = `${process.env.MQTT_BROKER_PASSWORD_PORT || "8885"}`;
    private MQTT_CERTIFICATE_PORT = `${
        process.env.MQTT_BROKER_CERTIFICATE_PORT || "8884"
    }`;
    passwordClient: Client;
    certificateClient: Client;

    private readonly logger = new Logger(InternalMqttBrokerListenerService.name);

    private readonly MQTT_DEVICE_DATA_PREFIX = "devices/";
    private readonly MQTT_DEVICE_DATA_TOPIC = this.MQTT_DEVICE_DATA_PREFIX + "#";

    public async onApplicationBootstrap(): Promise<void> {
        await this.seedSuperUser();
        const superUser = await this.iotDeviceService.getMqttListener();
        // TODO: get this file from somewhere else (Keyvault?, just in proj root?)
        const caCert = fs.readFileSync(caCertPath);
        this.passwordClient = connect(this.MQTT_URL, {
            clean: true,
            port: Number(this.MQTT_PASSWORD_PORT),
            clientId: "PasswordSuperUserClient",
            username: superUser.name,
            password: "SuperUser", // Connection has to be made with unhashed password
            ca: caCert,
        });
        // TODO: Removed while monitoring the need for 2 clients
        // this.certificateClient = connect(this.MQTT_URL, {
        //     clean: true,
        //     port: Number(this.MQTT_CERTIFICATE_PORT),
        //     clientId: "CertificateSuperUserClient",
        //     ca: caCert,
        //     cert: superUser.deviceCertificate,
        //     key: superUser.deviceCertificateKey,
        // });

        this.configureClient(this.passwordClient);
        // this.configureClient(this.certificateClient);
    }

    private configureClient(client: Client) {
        client.on("connect", () => {
            client.subscribe(this.MQTT_DEVICE_DATA_TOPIC);

            client.on("message", async (topic, message) => {
                this.logger.debug(
                    `Received MQTT - Topic: '${topic}' - message: '${message}'`
                );

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

    private async seedSuperUser() {
        if (await this.iotDeviceService.getMqttListener()) {
            this.logger.debug(
                "MQTT Listener superuser already exists. New one wont be seeded"
            );
            return;
        }

        const certificateDetails = await this.mqttService.generateCertificate(
            "SuperUser"
        );

        await this.mqttBrokerDeviceRepository.save({
            type: IoTDeviceType.MQTTBroker,
            applicationId: null,
            latitude: 0,
            longitude: 0,
            name: "SuperUser",
            authenticationType: AuthenticationType.PASSWORD,
            mqttpassword: this.mqttService.hashPassword("SuperUser"),
            mqttusername: "SuperUser",
            permissions: MQTTPermissionLevel.superUser,
            deviceCertificate: certificateDetails.deviceCertificate,
            deviceCertificateKey: certificateDetails.deviceCertificateKey,
        });
        this.logger.log("Created MQTT Listener SuperUser");
    }
}
