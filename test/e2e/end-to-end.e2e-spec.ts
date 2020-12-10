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
    generateSavedApplication,
    generateSavedConnection,
    generateSavedDataTarget,
    generateSavedHttpDevice,
    generateSavedOrganization,
    generateSavedPayloadDecoder,
} from "./test-helpers";
import { ReceiveDataModule } from "@modules/device-integrations/receive-data.module";
import { PayloadDecoderKafkaModule } from "@modules/data-management/payload-decoder-kafka.module";
import { PayloadDecoderModule } from "@modules/device-management/payload-decoder.module";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";
import waitForExpect from "wait-for-expect";
import { NoOpLogger } from "./no-op-logger";

describe("End-to-End (e2e)", () => {
    let app: INestApplication;
    let kafkaService: KafkaService;
    let httpService: HttpService;
    let httpPushService: HttpPushDataTargetService;
    let httpPushListener: any;

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
                KafkaModule,
                ReceiveDataModule,
                PayloadDecoderKafkaModule,
                DataTargetKafkaModule,
                PayloadDecoderModule,
            ],
        }).compile();
        moduleFixture.useLogger(new NoOpLogger());

        app = moduleFixture.createNestApplication();
        httpService = app.get<HttpService>(HttpService);
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        kafkaService = moduleFixture.get("KafkaService");
        httpPushService = moduleFixture.get("HttpPushDataTargetService");
        httpPushListener = jest.spyOn(httpPushService, "send");
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
        jest.clearAllMocks();
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
        await waitForExpect(() => {
            expect(httpPushListener).toHaveBeenCalledTimes(4);
        });
    }, 60_000);

    it("Setup 2 separate applications - IOT-1018 / IOT-960", async () => {
        const org1 = await generateSavedOrganization();
        const app1 = await generateSavedApplication(org1);
        const dev1 = await generateSavedHttpDevice(app1);
        const dt1 = await generateSavedDataTarget(
            app1,
            "https://endhndo0qpbanxp.m.pipedream.net"
        );

        const org2 = await generateSavedOrganization("2");
        const app2 = await generateSavedApplication(org2, "2");
        const dev2 = await generateSavedHttpDevice(app2);
        const pd2 = await generateSavedPayloadDecoder(org2);
        const dt2 = await generateSavedDataTarget(
            app2,
            "https://enge6zla3nxtmbo.m.pipedream.net"
        );

        await generateSavedConnection(dev1, dt1);
        await generateSavedConnection(dev2, dt2);
        await generateSavedConnection(dev2, dt2, pd2);

        // Act
        await request(app.getHttpServer())
            .post("/receive-data/?apiKey=" + dev1.apiKey)
            .send(dataToSend)
            .expect(204);

        // Assert
        await waitForExpect(() => {
            expect(httpPushListener).toHaveBeenCalledTimes(1);
        });
    }, 60_0000);

    it("Setup 2 separate applications - shared payload decoder - IOT-1018 / IOT-960", async () => {
        const org1 = await generateSavedOrganization();
        const app1 = await generateSavedApplication(org1);
        const dev1 = await generateSavedHttpDevice(app1);
        const dt1 = await generateSavedDataTarget(
            app1,
            "https://endhndo0qpbanxp.m.pipedream.net"
        );

        const org2 = await generateSavedOrganization("2");
        const app2 = await generateSavedApplication(org2, "2");
        const dev2 = await generateSavedHttpDevice(app2);
        const pd2 = await generateSavedPayloadDecoder(org2);
        const dt2 = await generateSavedDataTarget(
            app2,
            "https://enge6zla3nxtmbo.m.pipedream.net"
        );

        await generateSavedConnection(dev1, dt1, pd2);
        await generateSavedConnection(dev2, dt2, pd2);

        // Act
        await request(app.getHttpServer())
            .post("/receive-data/?apiKey=" + dev1.apiKey)
            .send(dataToSend)
            .expect(204);

        // Assert
        await waitForExpect(() => {
            expect(httpPushListener).toHaveBeenCalledTimes(1);
        });
    }, 60_0000);
});
