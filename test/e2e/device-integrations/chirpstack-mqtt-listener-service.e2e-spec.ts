import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Consumer, KafkaMessage } from "kafkajs";

import configuration from "@config/configuration";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { ChirpstackMqttListenerModule } from "@modules/device-integrations/chirpstack-mqtt-listener.module";
import { KafkaModule } from "@modules/kafka.module";
import { ChirpstackMQTTListenerService } from "@services/data-management/chirpstack-mqtt-listener.service";

import { setupKafkaListener, waitForEvents } from "../kafka-test-helpers";
import {
    clearDatabase,
    generateSavedApplication,
    generateSavedLoRaWANDevice,
} from "../test-helpers";

describe("ChirpstackMQTTListenerService (e2e)", () => {
    let app: INestApplication;
    let service: ChirpstackMQTTListenerService;
    let consumer: Consumer;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ load: [configuration] }),
                ChirpstackMqttListenerModule,
                TypeOrmModule.forRoot({
                    type: "postgres",
                    host: "host.docker.internal",
                    port: 5433,
                    username: "os2iot",
                    password: "toi2so",
                    database: "os2iot-e2e",
                    synchronize: true,
                    logging: false,
                    autoLoadEntities: true,
                }),
                KafkaModule.register({
                    clientId: "os2iot-client-e2e",
                    brokers: ["host.docker.internal:9093"],
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        service = moduleFixture.get("ChirpstackMQTTListenerService");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        await clearDatabase();
    });

    afterEach(async () => {
        await clearDatabase();
        if (consumer) {
            await consumer.disconnect();
        }
        if (service.client) {
            await service.client.end();
        }
    }, 30000);

    it("receiveMqttMessage - Elsys ERS", async () => {
        // Arrange
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedLoRaWANDevice(application);
        const rawData = `{
            "adr": true,
            "data": "AQECAisEAKIFAAcOKw==",
            "fCnt": 978,
            "fPort": 5,
            "devEUI": "${iotDevice.deviceEUI}",
            "txInfo": {
                "dr": 0,
                "frequency": 867700000
            },
            "deviceName": "os2iot-${iotDevice.name}",
            "applicationID": "4",
            "applicationName": "os2iot-b196848a-fe43-4852-9e1e-9cfe5d90d386"
        }`;

        // Store all the messages sent to kafka
        const kafkaMessages: [string, KafkaMessage][] = [];

        // Setup kafkaListener to see if it is sent correctly.
        consumer = await setupKafkaListener(
            consumer,
            kafkaMessages,
            KafkaTopic.RAW_REQUEST
        );

        // Act
        await service.receiveMqttMessage(rawData);

        // Sleep a bit until the message is processed (to avoid race-condition)
        await waitForEvents(kafkaMessages, 1);

        // Assert

        // Pull out the payloads passed along after transforming
        const payloads = kafkaMessages.map(x => {
            return JSON.parse(x[1].value.toString("utf8")).body;
        });

        expect(payloads[0]).toMatchObject({
            rawPayload: JSON.parse(rawData),
            iotDeviceId: iotDevice.id,
        });
    }, 30000);
});
