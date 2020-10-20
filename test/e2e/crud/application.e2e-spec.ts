import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { Repository, getManager } from "typeorm";

import configuration from "@config/configuration";
import { Application } from "@entities/application.entity";
import { CreateApplicationDto } from "@entities/dto/create-application.dto";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { ApplicationModule } from "@modules/device-management/application.module";
import { AuthModule } from "@modules/user-management/auth.module";

import {
    clearDatabase,
    generateSavedApplication,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateSavedReadWriteUser,
    generateValidJwtForUser,
    randomMacAddress,
} from "../test-helpers";
import { PermissionType } from "@enum/permission-type.enum";
import { ReadPermission } from "@entities/read-permission.entity";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ActivationType } from "@enum/lorawan-activation-type.enum";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";

describe("ApplicationController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<Application>;
    let globalAdminJwt: string;
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
                ApplicationModule,
                ChirpstackAdministrationModule,
                IoTDeviceModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("ApplicationRepository");

        iotDeviceService = moduleFixture.get("IoTDeviceService");
        deviceProfileService = moduleFixture.get("DeviceProfileService");
        serviceProfileService = moduleFixture.get("ServiceProfileService");
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
    it("(GET) /application/ - empty", () => {
        return request(app.getHttpServer())
            .get("/application/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toStrictEqual([]);
            });
    });

    it("(GET) /application/ - with elements already existing", async () => {
        await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
            {
                name: "Application2",
                description: "A description",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        return request(app.getHttpServer())
            .get("/application/")
            .auth(globalAdminJwt, { type: "bearer" })

            .send()
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(2);
                expect(response.body.data).toContainEqual({
                    name: "Test",
                    description: "Tester",
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                    id: expect.any(Number),
                    iotDevices: [],
                });
                expect(response.body.data).toContainEqual({
                    name: "Application2",
                    description: "A description",
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                    id: expect.any(Number),
                    iotDevices: [],
                });
            });
    });

    it("(GET) /application/ - with pagination", async () => {
        await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
            {
                name: "Application2",
                description: "A description",
                iotDevices: [],
                dataTargets: [],
            },
            {
                name: "Application3",
                description: "A third description",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        return request(app.getHttpServer())
            .get("/application?limit=1&offset=1")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                // Expect that the count it 3 since there is 3 objects saved in the database
                expect(response.body.count).toBe(3);
                // Expect that only one was returned
                expect(response.body.data).toHaveLength(1);
                expect(response.body.data).toMatchObject([
                    {
                        name: "Application2",
                        description: "A description",
                    },
                ]);
            });
    });

    it("(GET) /application/:id - Get one element by id", async () => {
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        const id = application[0].id;

        return request(app.getHttpServer())
            .get(`/application/${id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "Test",
                    description: "Tester",
                });
            });
    });

    it("(GET) /application/:id - Get one element by id - not found", async () => {
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        // should not exist
        const id = application[0].id + 1;

        return request(app.getHttpServer())
            .get(`/application/${id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(404)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: `MESSAGE.ID-DOES-NOT-EXIST`,
                });
            });
    });

    it("(POST) /application/ - Create application", async () => {
        const org = await generateSavedOrganization();

        const testAppOne: CreateApplicationDto = {
            name: "Post Test",
            description: "Post Tester",
            organizationId: org.id,
        };

        await request(app.getHttpServer())
            .post("/application/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(testAppOne)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "Post Test",
                    description: "Post Tester",
                    iotDevices: [] as any[],
                    dataTargets: [] as any[],
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
    });

    it("(POST) /application/ - Create application - fail as name is not unique", async () => {
        const org = await generateSavedOrganization();
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
                belongsTo: org,
            },
        ]);

        const testAppOne = {
            name: application[0].name,
            description: "Post Tester",
            organizationId: org.id,
        };

        await request(app.getHttpServer())
            .post("/application/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(testAppOne)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Bad Request",
                    message: "MESSAGE.NAME-INVALID-OR-ALREADY-IN-USE",
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
    });

    it("(DELETE) /application/ - Delete application", async () => {
        const org = await generateSavedOrganization();
        const application = await repository.save([
            {
                name: "test sletning",
                description: "test sletning description",
                iotDevices: [],
                dataTargets: [],
                belongsTo: org,
            },
        ]);
        const id = application[0].id;

        await request(app.getHttpServer())
            .delete(`/application/${id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    affected: 1,
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(0);
    });

    it("(DELETE) /application/ - Delete application - Not existing", async () => {
        const org = await generateSavedOrganization();
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
                belongsTo: org,
            },
        ]);
        const id = application[0].id + 1; // Doesn't exist

        await request(app.getHttpServer())
            .delete(`/application/${id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(404)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    status: 404,
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
    });

    it("(PUT) /application/ - Change application", async () => {
        const application = await generateSavedApplication();
        const id = application.id;

        const putTest = { name: "PUT Test", description: "PUT Tester" };

        await request(app.getHttpServer())
            .put(`/application/${id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(putTest)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: id,
                    name: "PUT Test",
                    description: "PUT Tester",
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
        expect(applicationInDatabase[0]).toMatchObject({
            id: id,
            name: "PUT Test",
            description: "PUT Tester",
        });
    });

    it("(PUT) /application/ - Change application - to same name allowed", async () => {
        const application = await generateSavedApplication();
        const id = application.id;

        const putTest = {
            name: application.name,
            description: "PUT Tester",
        };

        await request(app.getHttpServer())
            .put(`/application/${id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(putTest)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: id,
                    name: application.name,
                    description: "PUT Tester",
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
        expect(applicationInDatabase[0]).toMatchObject({
            id: id,
            name: application.name,
            description: "PUT Tester",
        });
    });

    it("(PUT) /application/ - Change application - to same name allowed of another, not allowed", async () => {
        const org = await generateSavedOrganization();
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
                belongsTo: org,
            },
            {
                name: "Test2",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
                belongsTo: org,
            },
        ]);
        const id = application[0].id;

        const putTest = {
            name: application[1].name,
            description: "PUT Tester",
        };

        await request(app.getHttpServer())
            .put(`/application/${id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(putTest)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Bad Request",
                    message: "MESSAGE.NAME-INVALID-OR-ALREADY-IN-USE",
                });
            });
    });

    it("(PUT) /application/ - Change application - show iotdevices and datatargets in results", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
                belongsTo: org,
            },
        ]);
        const id = application[0].id;

        const device = new GenericHTTPDevice();
        device.name = "E2E Test GENERIC HTTP device";
        device.application = application[0];
        device.apiKey = "DUMMY-API-KEY";
        device.metadata = JSON.parse('{"some_key": "a_value"}');

        const savedIoTDevice = await getManager().save(device);

        const putTest = {
            name: `${application[0].name} changed`,
            description: `${application[0].description} changed`,
            // NO IOTDEVICE ARRAY
            // NO DATA TARGET ARRAY
        };

        // Act
        await request(app.getHttpServer())
            .put(`/application/${id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(putTest)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                expect(response.body).toMatchObject({
                    name: "Test changed",
                    description: "Tester changed",
                    iotDevices: [{ id: savedIoTDevice.id }],
                    dataTargets: [],
                });
            });
    });

    it("(GET) /application/ - User only allowed SOME in organization", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const app1 = await generateSavedApplication(org, "app1");

        const user = await generateSavedReadWriteUser(org);
        const readPerm = user.permissions.find(
            x => x.type == PermissionType.Read
        ) as ReadPermission;
        readPerm.applications = [app1];
        const writePerm = user.permissions.find(
            x => x.type == PermissionType.Write
        ) as ReadPermission;
        writePerm.applications = [app1];
        await getManager().save([readPerm, writePerm]);

        const jwt = generateValidJwtForUser(user);

        // Act
        return request(app.getHttpServer())
            .get("/application/")
            .auth(jwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toContainEqual({
                    id: app1.id,
                    name: app1.name,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    iotDevices: [],
                    description: app1.description,
                });
            });
    });

    it("(GET) /application/:id - Includes chirpstakc battery stats", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const app1 = await generateSavedApplication(org, "app1");
        const mac = randomMacAddress();
        const deviceProfile = await deviceProfileService.findAllDeviceProfiles(100, 0);
        const serviceProfile = await serviceProfileService.findAllServiceProfiles(100, 0);
        const device = await iotDeviceService.create({
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
        });

        // Act
        return request(app.getHttpServer())
            .get("/application/" + app1.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: app1.id,
                    name: app1.name,
                    description: app1.description,
                });
                expect(response.body.iotDevices[0]).toMatchObject({
                    id: device.id,
                    name: device.name,
                    lorawanSettings: {
                        deviceStatusBattery: expect.any(Number),
                        deviceStatusMargin: expect.any(Number),
                    },
                });
            });
    });
});
