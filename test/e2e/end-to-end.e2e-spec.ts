import { HttpService, INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";

import configuration from "@config/configuration";
import { DataTargetKafkaModule } from "@modules/data-target/data-target-kafka.module";
import { KafkaModule } from "@modules/kafka.module";
import { KafkaService } from "@services/kafka/kafka.service";
import * as request from "supertest";

import {
    clearDatabase,
    generateIoTDevice,
    generateSavedApplication,
    generateSavedConnection,
    generateSavedDataTarget,
    generateSavedHttpDevice,
    generateSavedIoTDevice,
    generateSavedOrganization,
    generateSavedPayloadDecoder,
} from "./test-helpers";
import { ReceiveDataModule } from "@modules/device-integrations/receive-data.module";
import { PayloadDecoderKafkaModule } from "@modules/data-management/payload-decoder-kafka.module";
import { sleep } from "./kafka-test-helpers";
import { PayloadDecoderModule } from "@modules/device-management/payload-decoder.module";

describe("End-to-End (e2e)", () => {
    let app: INestApplication;
    let kafkaService: KafkaService;
    let httpService: HttpService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ load: [configuration] }),
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
                ReceiveDataModule,
                PayloadDecoderKafkaModule,
                DataTargetKafkaModule,
                PayloadDecoderModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        httpService = app.get<HttpService>(HttpService);
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        kafkaService = moduleFixture.get("KafkaService");
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

    const dataToSend = JSON.parse(`{
        "data": "AQEXAjEEAIsFCAcOPQ==",
        "freq": 867100000,
        "chan": 3,
        "tmst": 71333956,
        "utmms": 1597675976328,
        "rfch": 0,
        "stat": 1,
        "rssi": -39,
        "size": 26,
        "modu": "LORA",
        "datr": "SF12BW125",
        "codr": "4/5",
        "lsnr": 12
    }`);

    it("Setup 1 device + 1/null Payload Transformer + 2 Data target and send to device", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const device = await generateSavedHttpDevice(application);
        const dataTarget = await generateSavedDataTarget(
            application,
            "https://en8lpvhx096na9o.m.pipedream.net"
        );
        const dataTarget2 = await generateSavedDataTarget(
            application,
            "https://enc6m53hjzfkqrs.m.pipedream.net"
        );
        const payloadDecoder = await generateSavedPayloadDecoder(org);
        await generateSavedConnection(device, dataTarget);
        await generateSavedConnection(device, dataTarget, payloadDecoder);
        await generateSavedConnection(device, dataTarget2);
        await generateSavedConnection(device, dataTarget2, payloadDecoder);

        // Act
        await request(app.getHttpServer())
            .post("/receive-data/?apiKey=" + device.apiKey)
            .send(dataToSend)
            .expect(204);

        // Assert
        await sleep(5_000);
    }, 60_000);

    it.todo("Setup 3 devices, 1 payload transformer, 2 data targets and send to devices");
});
