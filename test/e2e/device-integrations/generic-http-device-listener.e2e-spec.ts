import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Consumer, KafkaMessage } from "kafkajs";
import * as request from "supertest";
import { Repository, getManager } from "typeorm";

import configuration from "@config/configuration";
import { Application } from "@entities/application.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { ReceiveDataModule } from "@modules/device-integrations/receive-data.module";
import { KafkaModule } from "@modules/kafka.module";

import { setupKafkaListener, sleep, waitForEvents } from "../kafka-test-helpers";
import { clearDatabase } from "../test-helpers";

describe("ReceiveDataController (e2e)", () => {
    let app: INestApplication;
    let applicationRepository: Repository<Application>;
    let consumer: Consumer;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ load: [configuration] }),
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
                KafkaModule,
            ],
        }).compile();
        moduleFixture.useLogger(false);

        app = moduleFixture.createNestApplication();
        await app.init();

        applicationRepository = moduleFixture.get("ApplicationRepository");
        consumer = await setupKafkaListener(consumer, [], KafkaTopic.RAW_REQUEST);
        await sleep(100);
        await consumer.disconnect();
    }, 30000);

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
        expect(payloads.length).toBeGreaterThanOrEqual(1);
    });

    it("(POST) /receive-data/  receive data from unregistered edge device (Test invalid API key)- expected 403- fobbidden", async () => {
        return await request(app.getHttpServer())
            .post("/receive-data/?apiKey=" + "invalidKey")
            .send(dataToSend)
            .expect(403);
    });
});
