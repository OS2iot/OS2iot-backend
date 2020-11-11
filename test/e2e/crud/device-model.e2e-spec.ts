import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { Repository, getManager } from "typeorm";

import configuration from "@config/configuration";
import { Application } from "@entities/application.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { AuthModule } from "@modules/user-management/auth.module";

import {
    clearDatabase,
    generateDeviceModel,
    generateSavedApplication,
    generateSavedDeviceModel,
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
import { ReceivedMessage } from "@entities/received-message";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { ActivationType } from "@enum/lorawan-activation-type.enum";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { DeviceModelController } from "@admin-controller/device-model.controller";
import { DeviceModelModule } from "@modules/device-management/device-model.module";
import { Organization } from "@entities/organization.entity";
import { DeviceModel } from "@entities/device-model.entity";
import { CreateDeviceModelDto } from "@dto/create-device-model.dto";
import { UpdateDeviceModelDto } from "@dto/update-device-model.dto";
import { DEFAULT_ECDH_CURVE } from "tls";

describe(`${DeviceModelController.name} (e2e)`, () => {
    let app: INestApplication;
    let repository: Repository<DeviceModel>;
    let globalAdminJwt: string;
    let org: Organization;

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
                DeviceModelModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("DeviceModelRepository");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        await clearDatabase();
        // Create user (global admin)
        const user = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(user);
        org = await generateSavedOrganization();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    it("(GET) /device-model/:id - none", async () => {
        const id = 1;
        const response = await request(app.getHttpServer())
            .get("/device-model/" + id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(404)
            .expect("Content-Type", /json/);
        await expect(response.body).toMatchObject({
            message: `MESSAGE.ID-DOES-NOT-EXIST`,
        });
    });

    it("(GET) /device-model/:id - one", async () => {
        const deviceModel = await generateSavedDeviceModel(org, "my device model");

        return await request(app.getHttpServer())
            .get("/device-model/" + deviceModel.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // console.log(response.body);
                expect(response.body).toMatchObject({
                    id: deviceModel.id,
                    body: {
                        name: "my device model",
                    },
                });
            });
    });

    it("(GET) /device-model/ - get all", async () => {
        const deviceModel = await generateSavedDeviceModel(org, "my device model");
        return await request(app.getHttpServer())
            .get(`/device-model?organizationId=${org.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data[0]).toMatchObject({
                    id: deviceModel.id,
                    body: {
                        name: "my device model",
                    },
                });
            });
    });

    it("(POST) /device-model/ - create new", async () => {
        const body = generateDeviceModel(org).body;
        const dto: CreateDeviceModelDto = {
            belongsToId: org.id,
            body: body,
        };

        await request(app.getHttpServer())
            .post("/device-model/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    body: body,
                });
            });

        const orgFromDb = await repository.findOne();
        expect(orgFromDb).toMatchObject({
            body: body,
        });
    });

    it("(POST) /device-model/ - Bad model, missing type", async () => {
        const body = {
            id: "myDevice-wastecontainer-sensor-345",
            name: "a name ",
            // type: "DeviceModel",
            category: ["sensor"],
            function: ["sensing"],
            brandName: "myDevice",
            modelName: "S4Container 345",
            manufacturerName: "myDevice Inc.",
            controlledProperty: ["fillingLevel", "temperature"],
        };
        const dto: CreateDeviceModelDto = {
            belongsToId: org.id,
            body: JSON.parse(JSON.stringify(body)),
        };

        return await request(app.getHttpServer())
            .post("/device-model/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Bad Request",
                    message: [
                        {
                            property: "type",
                            constraints: {
                                required: "should have required property 'type'",
                            },
                        },
                    ],
                });
            });
    });

    it("(PUT) /device-model/:id - bad change", async () => {
        const deviceModel = await generateSavedDeviceModel(org, "my device model");
        const body = {
            id: "myDevice-wastecontainer-sensor-345",
            name: "a name ",
            type: "DeviceModel",
            category: ["sensor"],
            function: ["sensing"],
            // brandName: "myDevice",
            modelName: "S4Container 345",
            manufacturerName: "myDevice Inc.",
            controlledProperty: ["fillingLevel", "temperature"],
        };
        const dto: UpdateDeviceModelDto = {
            body: JSON.parse(JSON.stringify(body)),
        };
        return await request(app.getHttpServer())
            .put("/device-model/" + deviceModel.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Bad Request",
                    message: [
                        {
                            property: "brandName",
                            constraints: {
                                required: "should have required property 'brandName'",
                            },
                        },
                    ],
                });
            });
    });

    it("(PUT) /device-model/:id - OK", async () => {
        const deviceModel = await generateSavedDeviceModel(org, "my device model");
        const body = {
            id: "myDevice-wastecontainer-sensor-345",
            name: "a new name!",
            type: "DeviceModel",
            category: ["sensor"],
            function: ["sensing"],
            brandName: "myDevice",
            modelName: "S4Container 345",
            manufacturerName: "myDevice Inc.",
            controlledProperty: ["fillingLevel", "temperature"],
        };
        const dto: UpdateDeviceModelDto = {
            body: JSON.parse(JSON.stringify(body)),
        };
        await request(app.getHttpServer())
            .put("/device-model/" + deviceModel.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    body: {
                        name: "a new name!",
                    },
                });
            });
        const orgFromDb = await repository.findOne();
        expect(orgFromDb).toMatchObject({
            body: body,
        });
    });

    it("(DELETE) /device-model/:id - OK", async () => {
        const deviceModel = await generateSavedDeviceModel(org, "my device model");
        expect(await repository.findOne()).not.toBeNull();

        await request(app.getHttpServer())
            .delete("/device-model/" + deviceModel.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    affected: 1,
                });
            });
    });
});
