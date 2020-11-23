import { INestApplication } from "@nestjs/common";
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
    generateSavedApplication,
    generateSavedGlobalAdminUser,
    generateSavedHttpDevice,
    generateSavedLoRaWANDevice,
    generateSavedOrganization,
    generateSavedSigfoxDevice,
    generateSavedSigfoxDeviceFromData,
    generateSavedSigFoxGroup,
    generateValidJwtForUser,
    randomMacAddress,
    SIGFOX_DEVICE_ID,
    SIGFOX_DEVICE_ID_2,
} from "../test-helpers";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { IoTDeviceType } from "@enum/device-type.enum";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";
import { CreateIoTDeviceDownlinkDto } from "@dto/create-iot-device-downlink.dto";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { CreateChirpstackDeviceQueueItemDto } from "@dto/chirpstack/create-chirpstack-device-queue-item.dto";
import { ReceivedMessage } from "@entities/received-message.entity";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { ActivationType } from "@enum/lorawan-activation-type.enum";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { User } from "@entities/user.entity";

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
        return await request(app.getHttpServer())
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
    });

    test.skip("(GET) /iot-device/:id - SigFox device", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        await generateSavedSigFoxGroup(org);
        const sigfoxDevice = await generateSavedSigfoxDevice(application);

        // Act
        return await request(app.getHttpServer())
            .get("/iot-device/" + sigfoxDevice.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // console.log(response.body);
                expect(response.body).toMatchObject({
                    name: sigfoxDevice.name,
                    sigfoxSettings: {
                        deviceId: sigfoxDevice.deviceId,
                        deviceTypeId: "5e74c318aa8aec41f9cc6b8d",
                        endProductCertificate: "P_0006_321A_01",
                        pac: "04FB9B9DD7F45D4E",
                        prototype: false,
                    },
                });
            });
    });

    test.skip("(POST) /iot-device/:id - SigFox device - Create connection", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const sigfoxGroup = await generateSavedSigFoxGroup(org);
        const dto: CreateIoTDeviceDto = {
            name: "E2E sigfox",
            applicationId: application.id,
            type: IoTDeviceType.SigFox,
            longitude: 12.34,
            latitude: 56.78,
            sigfoxSettings: {
                deviceId: SIGFOX_DEVICE_ID,
                connectToExistingDeviceInBackend: true,
                groupId: sigfoxGroup.id,
            },
        };

        // Act
        await request(app.getHttpServer())
            .post("/iot-device/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "E2E sigfox",
                });
            });
    });

    test.skip("(PUT) /iot-device/:id - SigFox device - Change name", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const sigfoxGroup = await generateSavedSigFoxGroup(org);
        // get device from sigfox backend and make a sigfoxdevice that represents it.
        const backendDevice = await sigfoxApiDeviceService.getByIdSimple(
            sigfoxGroup,
            SIGFOX_DEVICE_ID_2
        );
        const device = await generateSavedSigfoxDeviceFromData(
            application,
            backendDevice
        );

        const dto: UpdateIoTDeviceDto = {
            name: device.name + " - e2e",
            applicationId: device.application.id,
            type: device.type,
            longitude: backendDevice.location.lng,
            latitude: backendDevice.location.lat,
            sigfoxSettings: {
                deviceId: device.deviceId,
                deviceTypeId: device.deviceTypeId,
                connectToExistingDeviceInBackend: true,
                groupId: sigfoxGroup.id,
            },
        };
        // Act
        await request(app.getHttpServer())
            .put("/iot-device/" + device.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: device.name + " - e2e",
                });
            });
    });

    it("(POST) /iot-device/:id/downlink - LORAWAN device - Add downlink", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const lorawanDevice = await generateSavedLoRaWANDevice(application);

        const dto: CreateIoTDeviceDownlinkDto = {
            data: "3E0A14000000461700000002", // From https://www.elsys.se/en/downlink-generator/
            port: 6, // one above the normal port for elsys
            confirmed: true,
        };
        let fCnt;
        // Act
        await request(app.getHttpServer())
            .post(`/iot-device/${lorawanDevice.id}/downlink`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    fCnt: expect.any(Number),
                });
                fCnt = response.body.fCnt;
            });

        const queue: any = await chirpstackDeviceService.get(
            `devices/${lorawanDevice.deviceEUI}/queue`
        );
        expect(queue.deviceQueueItems[queue.deviceQueueItems.length - 1]).toMatchObject({
            devEUI: lorawanDevice.deviceEUI.toLocaleLowerCase(),
            confirmed: dto.confirmed,
            fCnt: fCnt,
            fPort: dto.port,
            data: "PgoUAAAARhcAAAAC",
            jsonObject: "",
        });
    });

    it("(POST) /iot-device/:id/downlink - LORAWAN device - bad id", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const lorawanDevice = await generateSavedLoRaWANDevice(application);
        const dto: CreateIoTDeviceDownlinkDto = {
            data: "3E0A14000000461700000002", // From https://www.elsys.se/en/downlink-generator/
            port: 6, // one above the normal port for elsys
            confirmed: true,
        };

        // Act
        await request(app.getHttpServer())
            .post(`/iot-device/${lorawanDevice.id + 1}/downlink`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(404);
    });

    it("(GET) /iot-device/:id/downlink - LORAWAN device", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const lorawanDevice = await generateSavedLoRaWANDevice(application);
        const csDto: CreateChirpstackDeviceQueueItemDto = {
            deviceQueueItem: {
                confirmed: true,
                data: "PgoUAAAARhcAAAAC",
                devEUI: lorawanDevice.deviceEUI,
                fPort: 6,
            },
        };
        // clear queue
        await chirpstackDeviceService.deleteDownlinkQueue(lorawanDevice.deviceEUI);
        await chirpstackDeviceService.overwriteDownlink(csDto);

        // Act
        await request(app.getHttpServer())
            .get(`/iot-device/${lorawanDevice.id}/downlink`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    deviceQueueItems: [
                        {
                            devEUI: lorawanDevice.deviceEUI.toLocaleLowerCase(),
                            confirmed: true,
                            fCnt: expect.any(Number),
                            fPort: 6,
                            data: "PgoUAAAARhcAAAAC",
                        },
                    ],
                    totalCount: 1,
                });
            });
    });

    test.skip("(POST) /iot-device/:id/downlink - SigFox device - OK", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const sigfoxDevice = await generateSavedSigfoxDevice(application);
        const dto: CreateIoTDeviceDownlinkDto = {
            data: "001e19028f101272",
        };

        // Act
        await request(app.getHttpServer())
            .post(`/iot-device/${sigfoxDevice.id}/downlink`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(201);

        const deviceAfter = await getManager().findOneOrFail(
            SigFoxDevice,
            sigfoxDevice.id
        );
        expect(deviceAfter.downlinkPayload).toBe(dto.data);
    });
});
