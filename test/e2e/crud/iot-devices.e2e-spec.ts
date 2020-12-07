import { INestApplication, Logger } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { Repository, getManager } from "typeorm";

import configuration from "@config/configuration";
import { Application } from "@entities/application.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata.entity";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { AuthModule } from "@modules/user-management/auth.module";

import {
    clearDatabase,
    createDeviceProfileData,
    createServiceProfileData,
    generateLoRaWANDevice,
    generateLoRaWanDownlink,
    generateSavedApplication,
    generateSavedGlobalAdminUser,
    generateSavedHttpDevice,
    generateSavedLoRaWANDevice,
    generateSavedOrganization,
    generateValidJwtForUser,
    randomMacAddress,
} from "../test-helpers";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { IoTDeviceType } from "@enum/device-type.enum";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ReceivedMessage } from "@entities/received-message.entity";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { ActivationType } from "@enum/lorawan-activation-type.enum";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { User } from "@entities/user.entity";
import { AuditLog } from "@services/audit-log.service";

describe("IoTDeviceController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<GenericHTTPDevice>;
    let applicationRepository: Repository<Application>;
    let globalAdminJwt: string;
    let globalAdmin: User;
    let service: IoTDeviceService;
    let sigfoxApiDeviceService: SigFoxApiDeviceService;
    let chirpstackDeviceService: ChirpstackDeviceService;
    let iotDeviceService: IoTDeviceService;
    let deviceProfileService: DeviceProfileService;
    let serviceProfileService: ServiceProfileService;

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
                IoTDeviceModule,
                ChirpstackAdministrationModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("GenericHTTPDeviceRepository");
        applicationRepository = moduleFixture.get("ApplicationRepository");
        service = moduleFixture.get("IoTDeviceService");
        sigfoxApiDeviceService = moduleFixture.get("SigFoxApiDeviceService");
        chirpstackDeviceService = moduleFixture.get(ChirpstackDeviceService.name);

        iotDeviceService = moduleFixture.get("IoTDeviceService");
        deviceProfileService = moduleFixture.get("DeviceProfileService");
        serviceProfileService = moduleFixture.get("ServiceProfileService");

        auditLogSuccessListener = jest.spyOn(AuditLog, "success");
        auditLogFailListener = jest.spyOn(AuditLog, "fail");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        await clearDatabase();
        // Create user (global admin)
        globalAdmin = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(globalAdmin);
    });

    afterEach(async () => {
        await clearDatabase();
        jest.clearAllMocks();
    });

    it("(GET) /iot-device/:id - none", async () => {
        const id = 1;
        const response = await request(app.getHttpServer())
            .get("/iot-device/" + id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
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
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
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
                    Date.parse(response.body.receivedMessagesMetadata[0].sentTime)
                ).toBeGreaterThanOrEqual(
                    Date.parse(response.body.receivedMessagesMetadata[1].sentTime)
                );
            });
    });

    it("(GET) /iot-device/:id - LoRaWAN", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const app1 = await generateSavedApplication(org, "app1");
        const mac = randomMacAddress();
        const deviceProfile = await deviceProfileService.findAllDeviceProfiles(100, 0);
        const serviceProfile = await serviceProfileService.findAllServiceProfiles(100, 0);
        const device = await iotDeviceService.create(
            {
                name: "E2E-" + mac,
                type: IoTDeviceType.LoRaWAN,
                applicationId: app1.id,
                longitude: 12,
                latitude: 32,
                comment: "asdf",
                commentOnLocation: "fdsa",
                metadata: JSON.parse("{}"),
                lorawanSettings: {
                    activationType: ActivationType.NONE,
                    devAddr: mac,
                    devEUI: mac,
                    deviceProfileID: deviceProfile.result[0].id,
                    serviceProfileID: serviceProfile.result[0].id,
                },
            },
            globalAdmin.id
        );

        return await request(app.getHttpServer())
            .get("/iot-device/" + device.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: device.id,
                    name: device.name,
                    type: IoTDeviceType.LoRaWAN,
                    lorawanSettings: {
                        deviceStatusBattery: expect.any(Number),
                        deviceStatusMargin: expect.any(Number),
                    },
                });
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

        await request(app.getHttpServer())
            .post("/iot-device/")
            .auth(globalAdminJwt, { type: "bearer" })
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

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(POST) /iot-device/:id/downlink - OK", async () => {
        const application = await generateSavedApplication();        
        let device = await createLoRaWANDeviceInChirpstack(
            app,
            globalAdminJwt,
            application
        );
        const dto = generateLoRaWanDownlink();

        await request(app.getHttpServer())
            .post(`/iot-device/${device.id}/downlink`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .expect("Content-Type", /json/);

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
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

        await request(app.getHttpServer())
            .put("/iot-device/" + iotDeviceId)
            .auth(globalAdminJwt, { type: "bearer" })
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

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
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
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({ affected: 1 });
            });

        const [res, count] = await repository.findAndCount();
        expect(res.length).toBe(0);
        expect(count).toBe(0);

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(DELETE) /iot-device/:id - with receivedData", async () => {
        // Arrnge
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const iotDevice = await generateSavedHttpDevice(application);

        const now = new Date();
        const metadata = new ReceivedMessageMetadata();
        metadata.sentTime = new Date(now.valueOf() - 10);
        metadata.device = iotDevice;
        const metadata2 = new ReceivedMessageMetadata();
        metadata2.sentTime = new Date(now.valueOf() - 24 * 60 * 60);
        metadata2.device = iotDevice;
        await getManager().save([metadata, metadata2]);

        const receivedMessage = new ReceivedMessage();
        receivedMessage.device = iotDevice;
        receivedMessage.rawData = JSON.parse(`{"asdf":1234}`);
        receivedMessage.sentTime = new Date(now.valueOf() - 10);
        await getManager().save(receivedMessage);

        await request(app.getHttpServer())
            .delete("/iot-device/" + iotDevice.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({ affected: 1 });
            });

        const [res, count] = await repository.findAndCount();
        expect(res.length).toBe(0);
        expect(count).toBe(0);

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
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
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(404)
            .expect("Content-Type", /json/);

        const [res, count] = await repository.findAndCount();
        expect(res.length).toBe(1);
        expect(count).toBe(1);

        expect(auditLogSuccessListener).not.toHaveBeenCalled();
        expect(auditLogFailListener).toHaveBeenCalled();
    });

    it("(DELETE) /iot-device/:id - LoRaWAN Device", async () => {
        const application = await generateSavedApplication();

        let device = await createLoRaWANDeviceInChirpstack(
            app,
            globalAdminJwt,
            application
        );

        let dbDevice = await repository.findOne(device.id);
        expect(dbDevice).not.toBeNull();

        const chirpstackDevice = await chirpstackDeviceService.getChirpstackDevice(
            device.deviceEUI
        );
        expect(chirpstackDevice).not.toBeNull();

        // act
        await request(app.getHttpServer())
            .delete("/iot-device/" + device.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                expect(response.body).toMatchObject({ affected: 1 });
            });

        let dbDeviceAfterDelete = await repository.findOne(device.id);
        expect(dbDeviceAfterDelete).toBeUndefined();

        await chirpstackDeviceService.getChirpstackDevice(device.deviceEUI).catch(err => {
            expect(err).toMatchObject({
                message: "object does not exist",
            });
        });
    });
});

async function createLoRaWANDeviceInChirpstack(
    app: INestApplication,
    globalAdminJwt: string,
    application: Application
) {
    let dpId = await request(app.getHttpServer())
        .post("/chirpstack/device-profiles/")
        .auth(globalAdminJwt, { type: "bearer" })
        .send(createDeviceProfileData())
        .expect(201)
        .expect("Content-Type", /json/)
        .then(response => {
            return response.body.id;
        });

    let spId = await request(app.getHttpServer())
        .post("/chirpstack/service-profiles/")
        .auth(globalAdminJwt, { type: "bearer" })
        .send(createServiceProfileData())
        .expect(201)
        .expect("Content-Type", /json/)
        .then(response => {
            return response.body.id;
        });

    const createDto: CreateIoTDeviceDto = {
        type: IoTDeviceType.LoRaWAN,
        longitude: 42,
        latitude: 42,
        lorawanSettings: {
            skipFCntCheck: false,
            fCntUp: 0,
            nFCntDown: 0,
            devEUI: randomMacAddress(),
            serviceProfileID: spId,
            deviceProfileID: dpId,
            OTAAapplicationKey: "13371337133713371337133713371337",
            activationType: ActivationType.OTAA,
        },
        applicationId: application.id,
        name: "e2e",
    };

    let device = await request(app.getHttpServer())
        .post("/iot-device/")
        .auth(globalAdminJwt, { type: "bearer" })
        .send(createDto)
        .then(response => {
            return response.body;
        });
    return device;
}
