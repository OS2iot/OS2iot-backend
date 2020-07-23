import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, Logger } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { clearDatabase } from "./test-helpers";
import { response } from "express";
import { RecieveDataModule } from "@modules/recieve-data.module";

describe("RecieveDataController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<IoTDevice>;
    let genericHTTPDeviceRepository: Repository<GenericHTTPDevice>;

    let applicationRepository: Repository<IoTDevice>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                RecieveDataModule,
                TypeOrmModule.forRoot({
                    type: "postgres",
                    host: "host.docker.internal",
                    port: 5433,
                    username: "os2iot",
                    password: "toi2so",
                    database: "os2iot-e2e",
                    synchronize: true,
                    logging: true,
                    autoLoadEntities: true,
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("IoTDeviceRepository");
        genericHTTPDeviceRepository = moduleFixture.get(
            "GenericHTTPDeviceRepository"
        );

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
    });

    it("(POST) /recieve-data/", async () => {
        // Insert data with correct API key - expected 400
        const applications = await applicationRepository.save([
            { name: "Test", description: "Tester", iotDevices: [] },
        ]);
        const appId = applications[0].id;

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        // @Hack: to call beforeInsert (private)
        (device as any).beforeInsert();

        const manager = getManager();
        const savedIoTDevice = await manager.save(device);

        const oldUuid = savedIoTDevice.apiKey;

        const changedIoTDeviceJson = {
            name: "changed",
            type: "GENERIC_HTTP",
            applicationId: appId,
            comment: "new comment",
        };

        return await request(app.getHttpServer())
            .post("/recieve-data/?apiKey=" + oldUuid)
            .send(changedIoTDeviceJson)
            .expect(200);
    });

    it("(POST) /recieve-data/", async () => {
        // Insert data with correct API key libut invd data - expected 400
        const applications = await applicationRepository.save([
            { name: "Test", description: "Tester", iotDevices: [] },
        ]);
        const appId = applications[0].id;

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        // @Hack: to call beforeInsert (private)
        (device as any).beforeInsert();

        const manager = getManager();
        const savedIoTDevice = await manager.save(device);
        //  Logger.log(savedIoTDevice);

        const oldUuid = savedIoTDevice.apiKey;

        return await request(app.getHttpServer())
            .post("/recieve-data/?apiKey=" + oldUuid)
            .send("data string is invalid")
            .expect(400);
    });

    it("(POST) /recieve-data/", async () => {
        // Insert invalid API key - expected 403- fobbidden
        const applications = await applicationRepository.save([
            { name: "Test", description: "Tester", iotDevices: [] },
        ]);
        const appId = applications[0].id;

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        // @Hack: to call beforeInsert (private)
        (device as any).beforeInsert();

        const manager = getManager();
        const savedIoTDevice = await manager.save(device);

        const oldUuid = savedIoTDevice.apiKey;

        const changedIoTDeviceJson = {
            name: "changed",
            type: "GENERIC_HTTP",
            applicationId: appId,
            comment: "new comment",
        };

        return await request(app.getHttpServer())
            .post("/recieve-data/?apiKey=" + "invalidKey")
            .send(changedIoTDeviceJson)
            .expect(403);
    });
});
