import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { clearDatabase } from "../test-helpers";
import { ReceiveDataModule } from "@modules/receive-data.module";
import { Application } from "@entities/application.entity";
import { KafkaModule } from "@modules/kafka.module";
import { KafkaMessage, Consumer } from "kafkajs";
import { setupKafkaListener, waitForEvents } from "../kafka-test-helpers";
import { KafkaTopic } from "@enum/kafka-topic.enum";

describe("ReceiveDataController (e2e)", () => {
    let app: INestApplication;
    let applicationRepository: Repository<Application>;
    let consumer: Consumer;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ReceiveDataModule,
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

        applicationRepository = moduleFixture.get("ApplicationRepository");
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
    }, 30000);

    const createApplications = async (): Promise<Application[]> => {
        return await applicationRepository.save([
            {
                name: "sample application",
                description: "sample description",
                iotDevices: [],
                dataTargets: [],
            },
            {
                name: "my application",
                description: "my cool application",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
    };
    const dataToSend = {
        string1: "string1",
        string2: "string2",
        number: 1,
    };
    it("(POST) /receive-data/ receive data from registered edge device (Test valid API key) - expected 204", async () => {
        const applications = await createApplications();

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        // @Hack: to call beforeInsert (private)
        (device as any).beforeInsert();
        const manager = getManager();
        const savedIoTDevice = await manager.save(device);

        // Store all the messages sent to kafka
        const kafkaMessages: [string, KafkaMessage][] = [];

        // Setup kafkaListener to see if it is sent correctly.
        consumer = await setupKafkaListener(
            consumer,
            kafkaMessages,
            KafkaTopic.RAW_REQUEST
        );

        // Act
        await request(app.getHttpServer())
            .post("/receive-data/?apiKey=" + savedIoTDevice.apiKey)
            .send(dataToSend)
            .expect(204);

        // Sleep a bit until the message is processed (to avoid race-condition)
        await waitForEvents(kafkaMessages, 1);

        // Assert

        // Pull out the payloads passed along after transforming
        const payloads = kafkaMessages.map(x => {
            return JSON.parse(x[1].value.toString("utf8")).body;
        });
        expect(payloads).toHaveLength(1);
    });

    it("(POST) /receive-data/  receive data from unregistered edge device (Test invalid API key)- expected 403- fobbidden", async () => {
        return await request(app.getHttpServer())
            .post("/receive-data/?apiKey=" + "invalidKey")
            .send(dataToSend)
            .expect(403);
    });
});
