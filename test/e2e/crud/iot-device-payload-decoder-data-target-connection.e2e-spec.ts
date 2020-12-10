import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { NoOpLogger } from "../no-op-logger";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { Repository } from "typeorm";

import configuration from "@config/configuration";
import { CreateIoTDevicePayloadDecoderDataTargetConnectionDto } from "@dto/create-iot-device-payload-decoder-data-target-connection.dto";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { Organization } from "@entities/organization.entity";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "@modules/device-management/iot-device-payload-decoder-data-target-connection.module";
import { AuthModule } from "@modules/user-management/auth.module";

import {
    clearDatabase,
    generateSavedApplication,
    generateSavedConnection,
    generateSavedDataTarget,
    generateSavedGlobalAdminUser,
    generateSavedIoTDevice,
    generateSavedLoRaWANDevice,
    generateSavedOrganization,
    generateSavedOrganizationAdminUser,
    generateSavedPayloadDecoder,
    generateValidJwtForUser,
} from "../test-helpers";
import { User } from "@entities/user.entity";
import { AuditLog } from "@services/audit-log.service";

describe("IoTDevicePayloadDecoderDataTargetConnection (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<IoTDevicePayloadDecoderDataTargetConnection>;
    const urlPath = "/iot-device-payload-decoder-data-target-connection/";
    let globalAdminJwt: string;
    let globalAdmin: User;
    let orgAdminJwt: string;
    let organisation: Organization;

    let auditLogSuccessListener: any;
    let auditLogFailListener: any;

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
        moduleFixture.useLogger(new NoOpLogger());

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get(
            "IoTDevicePayloadDecoderDataTargetConnectionRepository"
        );

        auditLogSuccessListener = jest.spyOn(AuditLog, "success");
        auditLogFailListener = jest.spyOn(AuditLog, "fail");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
        // Create user (global admin)
        globalAdmin = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(globalAdmin);

        organisation = await generateSavedOrganization();
        const nonAdminUser = await generateSavedOrganizationAdminUser(organisation);
        orgAdminJwt = generateValidJwtForUser(nonAdminUser);
    });

    afterEach(async () => {
        // Clear data after each test
        await clearDatabase();

        jest.clearAllMocks();
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
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
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
                        iotDevices: [
                            {
                                id: iotDevice.id,
                            },
                        ],
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

    it("(GET) /iot-device-payload-decoder-data-target-connection/ - One element - org admin", async () => {
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
        const dataTarget = await generateSavedDataTarget(application);
        await generateSavedConnection(iotDevice, dataTarget, payloadDecoder);

        return await request(app.getHttpServer())
            .get(urlPath)
            .auth(orgAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        iotDevices: [
                            {
                                id: iotDevice.id,
                            },
                        ],
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

    it("(GET) /iot-device-payload-decoder-data-target-connection/ - One element on another org - org admin", async () => {
        const otherOrg = await generateSavedOrganization("another one");
        const application = await generateSavedApplication(otherOrg);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(otherOrg);
        const dataTarget = await generateSavedDataTarget(application);
        await generateSavedConnection(iotDevice, dataTarget, payloadDecoder);

        return await request(app.getHttpServer())
            .get(urlPath)
            .auth(orgAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toMatchObject([]);
            });
    });

    it("(GET) /iot-device-payload-decoder-data-target-connection/byIoTDevice/:id - One element - org admin", async () => {
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
        const dataTarget = await generateSavedDataTarget(application);
        await generateSavedConnection(iotDevice, dataTarget, payloadDecoder);

        return await request(app.getHttpServer())
            .get(`${urlPath}byIoTDevice/${iotDevice.id}`)
            .auth(orgAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        iotDevices: [
                            {
                                id: iotDevice.id,
                            },
                        ],
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

    it("(GET) /iot-device-payload-decoder-data-target-connection/byPayloadDecoder/:id - One element - org admin", async () => {
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
        const dataTarget = await generateSavedDataTarget(application);
        await generateSavedConnection(iotDevice, dataTarget, payloadDecoder);

        return await request(app.getHttpServer())
            .get(`${urlPath}byPayloadDecoder/${payloadDecoder.id}`)
            .auth(orgAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        iotDevices: [
                            {
                                id: iotDevice.id,
                            },
                        ],
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

    it("(GET) /iot-device-payload-decoder-data-target-connection/byDataTarget/:id - One element - org admin", async () => {
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
        const dataTarget = await generateSavedDataTarget(application);
        await generateSavedConnection(iotDevice, dataTarget, payloadDecoder);

        return await request(app.getHttpServer())
            .get(`${urlPath}byDataTarget/${dataTarget.id}`)
            .auth(orgAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        iotDevices: [
                            {
                                id: iotDevice.id,
                            },
                        ],
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

    it("(GET) /iot-device-payload-decoder-data-target-connection/byIoTDevice/:id - One element - another org - org admin", async () => {
        const anotherOrg = await generateSavedOrganization("another");
        const application = await generateSavedApplication(anotherOrg);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(anotherOrg);
        const dataTarget = await generateSavedDataTarget(application);
        await generateSavedConnection(iotDevice, dataTarget, payloadDecoder);

        return await request(app.getHttpServer())
            .get(`${urlPath}byIoTDevice/${iotDevice.id}`)
            .auth(orgAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toMatchObject([]);
            });
    });

    it("(GET) /iot-device-payload-decoder-data-target-connection/byPayloadDecoder/:id - One element - another org - org admin", async () => {
        const anotherOrg = await generateSavedOrganization("another");
        const application = await generateSavedApplication(anotherOrg);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(anotherOrg);
        const dataTarget = await generateSavedDataTarget(application);
        await generateSavedConnection(iotDevice, dataTarget, payloadDecoder);

        return await request(app.getHttpServer())
            .get(`${urlPath}byPayloadDecoder/${payloadDecoder.id}`)
            .auth(orgAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toMatchObject([]);
            });
    });

    it("(GET) /iot-device-payload-decoder-data-target-connection/byDataTarget/:id - One element - another org - org admin", async () => {
        const anotherOrg = await generateSavedOrganization("another");
        const application = await generateSavedApplication(anotherOrg);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(anotherOrg);
        const dataTarget = await generateSavedDataTarget(application);
        await generateSavedConnection(iotDevice, dataTarget, payloadDecoder);

        return await request(app.getHttpServer())
            .get(`${urlPath}byDataTarget/${dataTarget.id}`)
            .auth(orgAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toMatchObject([]);
            });
    });

    it("(GET) /iot-device-payload-decoder-data-target-connection/:id - Found", async () => {
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
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
                    iotDevices: [
                        {
                            id: iotDevice.id,
                        },
                    ],
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
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
        const dataTarget = await generateSavedDataTarget(application);
        const dto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto = {
            iotDeviceIds: [iotDevice.id],
            dataTargetId: dataTarget.id,
            payloadDecoderId: payloadDecoder.id,
        };

        await request(app.getHttpServer())
            .post(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .then(response => {
                expect(response.body).toMatchObject({
                    iotDevices: [
                        {
                            id: iotDevice.id,
                        },
                    ],
                    payloadDecoder: {
                        id: payloadDecoder.id,
                    },
                    dataTarget: {
                        id: dataTarget.id,
                    },
                    updatedBy: globalAdmin.id,
                    createdBy: globalAdmin.id,
                });
            });

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(POST) /iot-device-payload-decoder-data-target-connection/:id - All ok - Multiple IoTDevices.", async () => {
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const loraDevice = await generateSavedLoRaWANDevice(application);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
        const dataTarget = await generateSavedDataTarget(application);
        const dto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto = {
            iotDeviceIds: [iotDevice.id, loraDevice.id],
            dataTargetId: dataTarget.id,
            payloadDecoderId: payloadDecoder.id,
        };

        await request(app.getHttpServer())
            .post(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .then(response => {
                expect(response.body).toMatchObject({
                    payloadDecoder: {
                        id: payloadDecoder.id,
                    },
                    dataTarget: {
                        id: dataTarget.id,
                    },
                    createdBy: globalAdmin.id,
                    updatedBy: globalAdmin.id,
                });
                expect(response.body.iotDevices.map((x: any) => x.id)).toContainEqual(
                    iotDevice.id
                );
                expect(response.body.iotDevices.map((x: any) => x.id)).toContainEqual(
                    loraDevice.id
                );
            });

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(POST) /iot-device-payload-decoder-data-target-connection/:id - No IoTDevices.", async () => {
        const application = await generateSavedApplication(organisation);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
        const dataTarget = await generateSavedDataTarget(application);
        const dto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto = {
            iotDeviceIds: [],
            dataTargetId: dataTarget.id,
            payloadDecoderId: payloadDecoder.id,
        };

        return await request(app.getHttpServer())
            .post(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(400)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: "Must contain at least one IoTDevice",
                });

                expect(auditLogSuccessListener).not.toHaveBeenCalled();
                expect(auditLogFailListener).toHaveBeenCalled();
            });
    });

    it("(POST) /iot-device-payload-decoder-data-target-connection/:id - No payload decoder", async () => {
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const dataTarget = await generateSavedDataTarget(application);
        const dto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto = {
            iotDeviceIds: [iotDevice.id],
            dataTargetId: dataTarget.id,
        };

        return await request(app.getHttpServer())
            .post(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .then(response => {
                expect(response.body).toMatchObject({
                    iotDevices: [
                        {
                            id: iotDevice.id,
                        },
                    ],
                    dataTarget: {
                        id: dataTarget.id,
                    },
                    createdBy: globalAdmin.id,
                    updatedBy: globalAdmin.id,
                });

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });

    it("(PUT) /iot-device-payload-decoder-data-target-connection/:id - Add payload decoder", async () => {
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const dataTarget = await generateSavedDataTarget(application);
        const connection = await generateSavedConnection(iotDevice, dataTarget);

        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
        const dto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto = {
            iotDeviceIds: connection.iotDevices.map(x => x.id),
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
                    updatedBy: globalAdmin.id,
                    iotDevices: [
                        {
                            id: iotDevice.id,
                        },
                    ],
                    dataTarget: {
                        id: dataTarget.id,
                    },
                    payloadDecoder: {
                        id: payloadDecoder.id,
                    },
                });

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });

    it("(PUT) /iot-device-payload-decoder-data-target-connection/:id - Remove payload decoder", async () => {
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const dataTarget = await generateSavedDataTarget(application);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
        const connection = await generateSavedConnection(
            iotDevice,
            dataTarget,
            payloadDecoder
        );
        const dto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto = {
            iotDeviceIds: connection.iotDevices.map(x => x.id),
            dataTargetId: connection.dataTarget.id,
        };

        return await request(app.getHttpServer())
            .post(urlPath)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .then(response => {
                expect(response.body).toMatchObject({
                    iotDevices: [
                        {
                            id: iotDevice.id,
                        },
                    ],
                    dataTarget: {
                        id: dataTarget.id,
                    },
                    updatedBy: globalAdmin.id,
                });
                expect(response.body).not.toHaveProperty("payloadDecoder");

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });

    it("(DELETE) /iot-device-payload-decoder-data-target-connection/:id - All ok", async () => {
        const application = await generateSavedApplication(organisation);
        const iotDevice = await generateSavedIoTDevice(application);
        const dataTarget = await generateSavedDataTarget(application);
        const payloadDecoder = await generateSavedPayloadDecoder(organisation);
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

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });
});
