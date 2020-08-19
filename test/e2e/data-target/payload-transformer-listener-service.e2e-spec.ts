import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, Logger } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KafkaModule } from "@modules/kafka.module";
import { PayloadTransformerListenerService } from "@services/payload-transformer.service";
import { PayloadDecoderModule } from "@modules/payload-decoder.module";
import {
    generateRawRequestLoRaWANKafkaPayload,
    clearDatabase,
    generateSavedApplication,
    generateSavedIoTDevice,
    generateSavedPayloadDecoder,
} from "../test-helpers";
import { Kafka, KafkaMessage, Consumer } from "kafkajs";
import { KafkaTopic } from "@enum/kafka-topic.enum";

describe("PayloadTransformerListenerService (e2e)", () => {
    let app: INestApplication;
    let service: PayloadTransformerListenerService;
    let consumer: Consumer;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                PayloadDecoderModule,
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
                    groupId: "os2iot-backend-e2ea",
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        service = moduleFixture.get("PayloadTransformerListenerService");

        // Get a reference to the repository such that we can CRUD on it.
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    }, 30000);

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
    });

    afterEach(async () => {
        // Clear data after each test
        await clearDatabase();
        if (consumer) {
            await consumer.disconnect();
        }
    }, 30000 /* Increate timeout to 30 secs, since the disconnect can be slow */);

    it("Test rawRequestListener - All OK", async () => {
        // Arrange
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedIoTDevice(application);
        const kafkaPayload = generateRawRequestLoRaWANKafkaPayload(
            iotDevice.id
        );
        kafkaPayload.body.unixTimestamp = null;
        const payloadDecoder = await generateSavedPayloadDecoder();
        service.hardCodedDecoderId = payloadDecoder.id;

        // Store all the messages sent to kafka
        const kafkaMessages: [string, KafkaMessage][] = [];

        // Setup kafkaListener to see if it is sent correctly.
        const kafka = new Kafka({
            ssl: false,
            clientId: "os2iot-client-e2e",
            brokers: ["host.docker.internal:9093"],
        });
        consumer = kafka.consumer({ groupId: "os2iot-backend-e2ea" });
        await consumer.connect();
        await consumer.subscribe({
            topic: KafkaTopic.TRANSFORMED_REQUEST,
            fromBeginning: false,
        });
        await consumer.run({
            eachMessage: async ({
                topic,
                message,
            }: {
                topic: string;
                message: KafkaMessage;
            }) => {
                Logger.debug(`Got new message in topic: ${topic}`);
                kafkaMessages.push([topic, message]);
            },
        });

        // Act
        await service.rawRequestListener(kafkaPayload);

        // Sleep a bit until the message is processed (to avoid race-condition)
        const start = new Date().getTime();
        while (kafkaMessages.length == 0) {
            await sleep(10);
            if (new Date().getTime() - start > 5000) {
                break;
            }
        }

        // Assert
        expect(kafkaMessages.length).toBeGreaterThanOrEqual(1);
        expect(kafkaMessages[0][0]).toBe(KafkaTopic.TRANSFORMED_REQUEST);
    }, 60000);
});

async function sleep(ms: number) {
    await _sleep(ms);
}

function _sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
