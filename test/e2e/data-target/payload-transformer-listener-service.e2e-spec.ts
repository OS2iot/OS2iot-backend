import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KafkaModule } from "@modules/kafka.module";
import { PayloadDecoderListenerService } from "@services/payload-decoder-listener.service";
import {
    generateRawRequestLoRaWANKafkaPayload,
    clearDatabase,
    generateSavedApplication,
    generateSavedIoTDevice,
    generateSavedPayloadDecoder,
    generateSavedDataTarget,
    generateSavedConnection,
} from "../test-helpers";
import { KafkaMessage, Consumer } from "kafkajs";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { PayloadDecoderKafkaModule } from "@modules/payload-decoder-kafka.module";
import { RawRequestDto } from "@dto/kafka/raw-request.dto";
import { setupKafkaListener, waitForEvents } from "../kafka-test-helpers";

describe(`${PayloadDecoderListenerService.name} (e2e)`, () => {
    let app: INestApplication;
    let service: PayloadDecoderListenerService;
    let consumer: Consumer;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                PayloadDecoderKafkaModule,
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
                    groupId: "os2iot-backend-e2e",
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        service = moduleFixture.get(PayloadDecoderListenerService.name);

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
        const rawPayload = (kafkaPayload.body as RawRequestDto).rawPayload;
        const payloadDecoder = await generateSavedPayloadDecoder();
        const dataTarget = await generateSavedDataTarget(application);
        await generateSavedConnection(iotDevice, dataTarget, payloadDecoder);
        await generateSavedConnection(iotDevice, dataTarget);

        // Store all the messages sent to kafka
        const kafkaMessages: [string, KafkaMessage][] = [];

        // Setup kafkaListener to see if it is sent correctly.
        consumer = await setupKafkaListener(
            consumer,
            kafkaMessages,
            KafkaTopic.TRANSFORMED_REQUEST
        );

        // Act
        await service.rawRequestListener(kafkaPayload);

        // Sleep a bit until the message is processed (to avoid race-condition)
        await waitForEvents(kafkaMessages, 2);

        // Assert
        expect(kafkaMessages.length).toBeGreaterThanOrEqual(2);

        // Pull out the payloads passed along after transforming
        const payloads = kafkaMessages.map(x => {
            return JSON.parse(x[1].value.toString("utf8")).body.payload;
        });

        // Expect the decoded payload
        expect(payloads).toContainEqual({
            decoded: {
                humidity: 49,
                light: 139,
                motion: 8,
                temperature: 27.9,
                vdd: 3645,
            },
        });
        // Expect the non-decoded payload
        expect(payloads).toContainEqual(rawPayload);
    }, 60000);
});

// TODO: rainy day test-case (dårlig JS)
