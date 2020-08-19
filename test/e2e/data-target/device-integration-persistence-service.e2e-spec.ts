import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, Logger } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
    clearDatabase,
    generateRawRequestSigfoxKafkaPayload,
    generateSavedApplication,
    generateSavedIoTDevice,
} from "../test-helpers";
import { KafkaModule } from "@modules/kafka.module";
import { DeviceIntegrationPersistenceModule } from "@modules/data-management/device-integration-persistence.module";
import { DeviceIntegrationPersistenceService } from "@services/data-management/device-integration-persistence.service";
import { ReceivedMessage } from "@entities/received-message";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";

describe("DeviceIntegrationPersistenceService (e2e)", () => {
    let app: INestApplication;
    let service: DeviceIntegrationPersistenceService;
    let receivedMessageRepository: Repository<ReceivedMessage>;
    let receivedMessageMetadataRepository: Repository<ReceivedMessageMetadata>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                DeviceIntegrationPersistenceModule,
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
        service = moduleFixture.get("DeviceIntegrationPersistenceService");

        // Get a reference to the repository such that we can CRUD on it.
        receivedMessageRepository = moduleFixture.get(
            "ReceivedMessageRepository"
        );
        receivedMessageMetadataRepository = moduleFixture.get(
            "ReceivedMessageMetadataRepository"
        );
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
    });

    afterEach(async () => {
        // Clear data after each test
        await clearDatabase();
    });

    it("Test rawRequestListener - all OK", async () => {
        // Arrange
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedIoTDevice(application);
        const kafkaPayload = generateRawRequestSigfoxKafkaPayload(iotDevice.id);
        kafkaPayload.body.unixTimestamp = null;

        // Act
        await service.rawRequestListener(kafkaPayload);

        // Assert
        const allMessages = await receivedMessageRepository.find();
        expect(allMessages).toHaveLength(1);
        Logger.debug(`Messages: ${JSON.stringify(allMessages)}`);
        expect(allMessages[0]).toMatchObject({
            rawData: kafkaPayload.body.rawPayload,
        });

        const allMetadata = await receivedMessageMetadataRepository.find();
        expect(allMetadata).toHaveLength(1);
        Logger.debug(`Metadata: ${JSON.stringify(allMetadata)}`);
        expect(allMetadata[0]).toHaveProperty("sentTime");
    });

    it("Test rawRequestListener - Multiple calls", async () => {
        // Arrange
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedIoTDevice(application);
        const kafkaPayload = generateRawRequestSigfoxKafkaPayload(iotDevice.id);
        kafkaPayload.body.unixTimestamp = 0;

        // Act
        for (let i = 0; i <= 10; i++) {
            kafkaPayload.messageId = "genericHttp1596721546" + i;
            kafkaPayload.body.unixTimestamp += 1000;
            await service.rawRequestListener(kafkaPayload);
        }

        // Assert
        const allMessages = await receivedMessageRepository.find();
        expect(allMessages).toHaveLength(1);
        Logger.debug(`Messages: ${JSON.stringify(allMessages)}`);
        expect(allMessages[0]).toMatchObject({
            sentTime: new Date(11000),
            rawData: kafkaPayload.body.rawPayload,
        });

        const allMetadata = await receivedMessageMetadataRepository.find();
        expect(allMetadata).toHaveLength(10);
        Logger.debug(`Metadata: ${JSON.stringify(allMetadata)}`);
        expect(allMetadata[0]).toMatchObject({
            sentTime: new Date(2000),
        });
    }, 30000);
});
