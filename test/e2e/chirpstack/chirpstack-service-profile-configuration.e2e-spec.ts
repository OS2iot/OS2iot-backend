import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";

import configuration from "@config/configuration";
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { AuthModule } from "@modules/user-management/auth.module";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";

import {
    cleanChirpstackApplications,
    clearDatabase,
    createDeviceProfileData,
    createServiceProfileData,
    generateSavedApplication,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateValidJwtForUser,
    randomMacAddress,
} from "../test-helpers";
import { User } from "@entities/user.entity";
import { AuditLog } from "@services/audit-log.service";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ActivationType } from "@enum/lorawan-activation-type.enum";

describe("ChirpstackServiceProfileConfiguration", () => {
    let serviceProfileService: ServiceProfileService;
    let app: INestApplication;
    let globalAdminJwt: string;
    let globalAdmin: User;
    const testname = "e2e";

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
                ChirpstackAdministrationModule,
            ],
        }).compile();
        moduleFixture.useLogger(false);
        app = moduleFixture.createNestApplication();
        await app.init();

        serviceProfileService = moduleFixture.get("ServiceProfileService");

        auditLogSuccessListener = jest.spyOn(AuditLog, "success");
        auditLogFailListener = jest.spyOn(AuditLog, "fail");
    });

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
        // Create user (global admin)
        globalAdmin = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(globalAdmin);
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    afterEach(async () => {
        await cleanChirpstackApplications(serviceProfileService, testname);
        await serviceProfileService.findAllServiceProfiles(1000, 0).then(response => {
            response.result.forEach(async serviceProfile => {
                if (serviceProfile.name.startsWith(testname)) {
                    await serviceProfileService.deleteServiceProfile(serviceProfile.id);
                }
            });
        });
        jest.clearAllMocks();
    });

    it("(POST) /chirpstack/service-profiles/ - OK", async () => {
        // Arrange
        const data: CreateServiceProfileDto = createServiceProfileData();

        // Act
        return await request(app.getHttpServer())
            .post("/chirpstack/service-profiles/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(data)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                // Unfortunately we just get a UUID from Chirpstack
                expect(response.body).toHaveProperty("id");

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });

    it("(GET) /chirpstack/service-profiles/:id - OK", async () => {
        // Arrange
        const data: CreateServiceProfileDto = createServiceProfileData();
        const result = await serviceProfileService.createServiceProfile(data);
        const serviceProfileId = result.data.id;

        // Act
        return await request(app.getHttpServer())
            .get("/chirpstack/service-profiles/" + serviceProfileId)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                expect(response.body).toMatchObject({
                    serviceProfile: {
                        name: testname,
                    },
                });
            });
    });

    it("(GET) /chirpstack/service-profiles/ - OK", async () => {
        // Arrange
        const data: CreateServiceProfileDto = createServiceProfileData();
        const result1 = await serviceProfileService.createServiceProfile(data);

        data.serviceProfile.name = `${testname}-changed`;
        const result2 = await serviceProfileService.createServiceProfile(data);

        // Act
        return await request(app.getHttpServer())
            .get("/chirpstack/service-profiles/")
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                expect(response.body.result).toContainEqual({
                    id: result1.data.id,
                    name: testname,
                    networkServerID: expect.any(String),
                    networkServerName: "",
                    organizationID: expect.any(String),
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                });

                expect(response.body.result).toContainEqual({
                    id: result2.data.id,
                    name: `${testname}-changed`,
                    networkServerID: expect.any(String),
                    networkServerName: "",
                    organizationID: expect.any(String),
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                });
            });
    });

    it("(PUT) /chirpstack/service-profiles/:id - OK", async () => {
        // Arrange
        const original: CreateServiceProfileDto = createServiceProfileData();
        const result = await serviceProfileService.createServiceProfile(original);
        const serviceProfileId = result.data.id;

        const changed = original;
        changed.serviceProfile.name = `${testname}-changed`;

        // Act
        await request(app.getHttpServer())
            .put("/chirpstack/service-profiles/" + serviceProfileId)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(changed)
            // Assert
            // No body is sent back from Chirpstack :'(
            .expect(204);

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(DELETE) /chirpstack/service-profiles/:id - OK", async () => {
        //Arrange
        const data: CreateServiceProfileDto = createServiceProfileData();
        const result = await serviceProfileService.createServiceProfile(data);
        const serviceProfileId = result.data.id;
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);

        const dpId = await request(app.getHttpServer())
            .post("/chirpstack/device-profiles/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(createDeviceProfileData())
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
                serviceProfileID: serviceProfileId,
                deviceProfileID: dpId,
                OTAAapplicationKey: "13371337133713371337133713371337",
                activationType: ActivationType.OTAA,
            },
            applicationId: application.id,
            name: "e2e",
        };

        await request(app.getHttpServer())
            .post("/iot-device/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(createDto)
            .then(response => {
                return response.body;
            });

        // Act
        return await request(app.getHttpServer())
            .delete("/chirpstack/service-profiles/" + serviceProfileId)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                expect(response.body).toMatchObject({
                    affected: 1,
                });

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });
});
