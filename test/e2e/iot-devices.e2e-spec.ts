import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { clearDatabase } from "./test-helpers";
import { Application } from "@entities/application.entity";
import { KafkaModule } from "@modules/kafka.module";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";

describe("IoTDeviceController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<GenericHTTPDevice>;
    let applicationRepository: Repository<Application>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                IoTDeviceModule,
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
                KafkaModule.register({
                    clientId: "os2iot-client-e2e",
                    brokers: ["host.docker.internal:9093"],
                    groupId: "os2iot-backend-e2e",
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("GenericHTTPDeviceRepository");
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

    it("(GET) /iot-device/:id - none", async () => {
        const id = 1;
        const response = await request(app.getHttpServer())
            .get("/iot-device/" + id)
            .expect(404)
            .expect("Content-Type", /json/);
        await expect(response.body).toMatchObject({
            message: `MESSAGE.ID-DOES-NOT-EXIST`,
        });
    });

    it("(GET) /iot-device/:id - one", async () => {
        const applications = await applicationRepository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
        const appId = applications[0].id;

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        device.apiKey = "asdf";
        device.metadata = JSON.parse('{ "a_key": "a_value" }');

        const manager = getManager();
        const iotDevice = await manager.save(device);

        const iotDeviceId = iotDevice.id;

        const now = new Date();
        const metadata = new ReceivedMessageMetadata();
        metadata.sentTime = new Date(now.valueOf() - 10);
        metadata.device = iotDevice;
        const metadata2 = new ReceivedMessageMetadata();
        metadata2.sentTime = new Date(now.valueOf() - 24 * 60 * 60);
        metadata2.device = iotDevice;

        await manager.save([metadata, metadata2]);

        return await request(app.getHttpServer())
            .get("/iot-device/" + iotDeviceId)
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                // console.log(response.body);
                expect(response.body).toMatchObject({
                    name: "HTTP device",
                    application: {
                        id: appId,
                    },
                    metadata: {
                        a_key: "a_value",
                    },
                });
                expect(response.body.receivedMessagesMetadata).toHaveLength(2);
                expect(
                    Date.parse(
                        response.body.receivedMessagesMetadata[0].sentTime
                    )
                ).toBeGreaterThanOrEqual(
                    Date.parse(
                        response.body.receivedMessagesMetadata[1].sentTime
                    )
                );
            });
    });

    it("(POST) /iot-device/", async () => {
        const applications = await applicationRepository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
        const appId = applications[0].id;
        const testIoTDevice = {
            name: "created",
            type: "GENERIC_HTTP",
            applicationId: appId,
            comment: "string",
            metadata: {
                key1: "value1",
                key2: 1234.567,
                key3: true,
                complex1: ["asdf", "b", "c", 1, true],
            },
        };
        return await request(app.getHttpServer())
            .post("/iot-device/")
            .send(testIoTDevice)
            .expect(201)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "created",
                    type: "GENERIC_HTTP",
                    application: {
                        id: appId,
                    },
                    comment: "string",
                    location: null,
                    commentOnLocation: null,
                    metadata: {
                        key1: "value1",
                        key2: 1234.567,
                        key3: true,
                        complex1: ["asdf", "b", "c", 1, true],
                    },
                });
            });
    });

    it("(PUT) /iot-device/:id", async () => {
        const applications = await applicationRepository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
        const appId = applications[0].id;

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        device.metadata = JSON.parse('{ "a_key": "a_value" }');
        // @Hack: to call beforeInsert (private)
        (device as any).beforeInsert();

        const manager = getManager();
        const savedIoTDevice = await manager.save(device);

        const iotDeviceId = savedIoTDevice.id;
        const oldUuid = savedIoTDevice.apiKey;

        const changedIoTDeviceJson = {
            name: "changed",
            type: "GENERIC_HTTP",
            applicationId: appId,
            comment: "new comment",
            metadata: { b_key: "b_value" },
        };

        return await request(app.getHttpServer())
            .put("/iot-device/" + iotDeviceId)
            .send(changedIoTDeviceJson)
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "changed",
                    type: "GENERIC_HTTP",
                    application: {
                        id: appId,
                    },
                    comment: "new comment",
                    location: null,
                    commentOnLocation: null,
                    metadata: { b_key: "b_value" },
                    apiKey: oldUuid, // Check that the apiKey is preserved.
                });
            });
    });

    it("(DELETE) /iot-device/:id", async () => {
        const applications = await applicationRepository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        // @Hack: to call beforeInsert (private)
        (device as any).beforeInsert();

        const manager = getManager();
        const savedIoTDevice = await manager.save(device);

        const iotDeviceId = savedIoTDevice.id;

        await request(app.getHttpServer())
            .delete("/iot-device/" + iotDeviceId)
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({ affected: 1 });
            });

        const [res, count] = await repository.findAndCount();
        expect(res.length).toBe(0);
        expect(count).toBe(0);
    });

    it("(DELETE) /iot-device/:id - doesn't exist", async () => {
        const applications = await applicationRepository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        // @Hack: to call beforeInsert (private)
        (device as any).beforeInsert();

        const manager = getManager();
        const savedIoTDevice = await manager.save(device);

        const iotDeviceId = savedIoTDevice.id + 1; // Should not exist

        await request(app.getHttpServer())
            .delete("/iot-device/" + iotDeviceId)
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({ affected: 0 });
            });

        const [res, count] = await repository.findAndCount();
        expect(res.length).toBe(1);
        expect(count).toBe(1);
    });
});
