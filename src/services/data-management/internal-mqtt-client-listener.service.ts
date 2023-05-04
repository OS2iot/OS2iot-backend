import {
    forwardRef,
    Inject,
    Injectable,
    Logger,
    OnApplicationBootstrap,
} from "@nestjs/common";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { Client, connect } from "mqtt";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { MQTTSubscriberDevice } from "@entities/mqtt-subscriber-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { MqttClientId } from "@config/constants/mqtt-constants";

@Injectable()
export class InternalMqttClientListenerService implements OnApplicationBootstrap {
    constructor(
        private receiveDataService: ReceiveDataService,
        @Inject(forwardRef(() => IoTDeviceService))
        private iotDeviceService: IoTDeviceService
    ) {
        this.clientDictionary = new Map<number, Client>();
    }

    clientDictionary: Map<number, Client>;
    private readonly logger = new Logger(InternalMqttClientListenerService.name);

    public async onApplicationBootstrap(): Promise<void> {
        // Get all subscriber devices
        const mqttSubscribers = await this.iotDeviceService.getAllMQTTSubscribers();

        // Create clients for each device (Could share on a broker level)
        this.createMQTTClients(
            mqttSubscribers.filter(d => !this.clientDictionary.has(d.id))
        );
    }

    public createMQTTClients(mqttSubscribers: MQTTSubscriberDevice[]) {
        mqttSubscribers.forEach(d => {
            const key = d.deviceCertificateKey;
            const client = connect(d.mqttURL, {
                clean: true,
                port: d.mqttPort,
                clientId: MqttClientId + ": " + d.name,
                username: d.mqttusername,
                password: d.mqttpassword,
                cert: d.deviceCertificate,
                key: key,
                ca: d.caCertificate,
                rejectUnauthorized: false,
            });
            this.setupClient(client, d);
            this.clientDictionary.set(d.id, client);
        });
    }

    public removeMQTTClient(mqttSubscriber: MQTTSubscriberDevice) {
        this.clientDictionary
            .get(mqttSubscriber.id)
            .end(false, {}, () => this.clientDictionary.delete(mqttSubscriber.id));
        this.logger.debug(`Removed client for deviceId: ${mqttSubscriber.id}`);
    }

    private setupClient(client: Client, device: MQTTSubscriberDevice) {
        client.on("connect", () => {
            client.subscribe(device.mqtttopicname);

            client.on("message", async (topic, message) => {
                await this.handleMessage(message.toString(), device);
            });
        });
        this.logger.debug(`Connected to ${device.mqttURL} for deviceId: ${device.id}`);
    }

    private async handleMessage(message: string, device: MQTTSubscriberDevice) {
        await this.receiveDataService.sendRawIotDeviceRequestToKafka(
            device,
            message,
            IoTDeviceType.MQTTSubscriber.toString()
        );
    }
}
