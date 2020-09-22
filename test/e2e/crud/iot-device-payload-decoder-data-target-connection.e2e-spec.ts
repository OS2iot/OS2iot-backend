import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
    clearDatabase,
    generateSavedPayloadDecoder,
    generateSavedConnection,
    generateSavedIoTDevice,
    generateSavedApplication,
    generateSavedDataTarget,
    generateSavedGlobalAdminUser,
    generateValidJwtForUser,
} from "../test-helpers";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "@modules/iot-device-payload-decoder-data-target-connection.module";
import { CreateIoTDevicePayloadDecoderDataTargetConnectionDto } from "@dto/create-iot-device-payload-decoder-data-target-connection.dto";
import { ConfigModule } from "@nestjs/config";
import configuration from "@config/configuration";
import { AuthModule } from "@modules/auth.module";

describe("IoTDevicePayloadDecoderDataTargetConnection (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<IoTDevicePayloadDecoderDataTargetConnection>;
    const urlPath = "/iot-device-payload-decoder-data-target-connection/";
    let globalAdminJwt: string;

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
                AuthModule,
                IoTDevicePayloadDecoderDataTargetConnectionModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get(
            "IoTDevicePayloadDecoderDataTargetConnectionRepository"
        );
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
        // Create user (global admin)
        const user = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(user);
    });

    afterEach(async () => {
        // Clear data after each test
        await clearDatabase();
    });

    it("(GET) /iot-device-payload-decoder-data-target-connection/ - Empty", async () => {
        return await request(app.getHttpServer())
            .get(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toStrictEqual([]);
            });
    });

    it("(GET) /iot-device-payload-decoder-data-target-connection/ - One element", async () => {
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder();
        const dataTarget = await generateSavedDataTarget(application);
        await generateSavedConnection(iotDevice, dataTarget, payloadDecoder);

        return await request(app.getHttpServer())
            .get(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        iotDevice: {
                            id: iotDevice.id,
                        },
                        payloadDecoder: {
                            id: payloadDecoder.id,
                        },
                        dataTarget: {
                            id: dataTarget.id,
                        },
                    },
                ]);
            });
    });

    it("(GET) /iot-device-payload-decoder-data-target-connection/:id - Found", async () => {
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder();
        const dataTarget = await generateSavedDataTarget(application);
        const connection = await generateSavedConnection(
            iotDevice,
            dataTarget,
            payloadDecoder
        );

        return await request(app.getHttpServer())
            .get(`${urlPath}${connection.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: connection.id,
                    iotDevice: {
                        id: iotDevice.id,
                    },
                    payloadDecoder: {
                        id: payloadDecoder.id,
                    },
                    dataTarget: {
                        id: dataTarget.id,
                    },
                });
            });
    });

    it("(POST) /iot-device-payload-decoder-data-target-connection/:id - All ok", async () => {
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder();
        const dataTarget = await generateSavedDataTarget(application);
        const dto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto = {
            iotDeviceId: iotDevice.id,
            dataTargetId: dataTarget.id,
            payloadDecoderId: payloadDecoder.id,
        };

        return await request(app.getHttpServer())
            .post(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .then(response => {
                expect(response.body).toMatchObject({
                    iotDevice: {
                        id: iotDevice.id,
                    },
                    payloadDecoder: {
                        id: payloadDecoder.id,
                    },
                    dataTarget: {
                        id: dataTarget.id,
                    },
                });
            });
    });

    it("(POST) /iot-device-payload-decoder-data-target-connection/:id - No payload decoder", async () => {
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedIoTDevice(application);
        const dataTarget = await generateSavedDataTarget(application);
        const dto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto = {
            iotDeviceId: iotDevice.id,
            dataTargetId: dataTarget.id,
        };

        return await request(app.getHttpServer())
            .post(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .then(response => {
                expect(response.body).toMatchObject({
                    iotDevice: {
                        id: iotDevice.id,
                    },
                    dataTarget: {
                        id: dataTarget.id,
                    },
                });
            });
    });

    it("(PUT) /iot-device-payload-decoder-data-target-connection/:id - Add payload decoder", async () => {
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedIoTDevice(application);
        const dataTarget = await generateSavedDataTarget(application);
        const connection = await generateSavedConnection(iotDevice, dataTarget);

        const payloadDecoder = await generateSavedPayloadDecoder();
        const dto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto = {
            iotDeviceId: connection.iotDevice.id,
            dataTargetId: connection.dataTarget.id,
            payloadDecoderId: payloadDecoder.id,
        };

        return await request(app.getHttpServer())
            .post(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .then(response => {
                expect(response.body).toMatchObject({
                    iotDevice: {
                        id: iotDevice.id,
                    },
                    dataTarget: {
                        id: dataTarget.id,
                    },
                    payloadDecoder: {
                        id: payloadDecoder.id,
                    },
                });
            });
    });

    it("(PUT) /iot-device-payload-decoder-data-target-connection/:id - Remove payload decoder", async () => {
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedIoTDevice(application);
        const dataTarget = await generateSavedDataTarget(application);
        const payloadDecoder = await generateSavedPayloadDecoder();
        const connection = await generateSavedConnection(
            iotDevice,
            dataTarget,
            payloadDecoder
        );
        const dto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto = {
            iotDeviceId: connection.iotDevice.id,
            dataTargetId: connection.dataTarget.id,
        };

        return await request(app.getHttpServer())
            .post(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .then(response => {
                expect(response.body).toMatchObject({
                    iotDevice: {
                        id: iotDevice.id,
                    },
                    dataTarget: {
                        id: dataTarget.id,
                    },
                });
                expect(response.body).not.toHaveProperty("payloadDecoder");
            });
    });

    it("(DELETE) /iot-device-payload-decoder-data-target-connection/:id - All ok", async () => {
        const application = await generateSavedApplication();
        const iotDevice = await generateSavedIoTDevice(application);
        const dataTarget = await generateSavedDataTarget(application);
        const payloadDecoder = await generateSavedPayloadDecoder();
        const connection = await generateSavedConnection(
            iotDevice,
            dataTarget,
            payloadDecoder
        );

        await request(app.getHttpServer())
            .delete(`${urlPath}${connection.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body).toMatchObject({
                    affected: 1,
                });
            });

        const allConnections = await repository.find();
        expect(allConnections).toHaveLength(0);
    });
});
