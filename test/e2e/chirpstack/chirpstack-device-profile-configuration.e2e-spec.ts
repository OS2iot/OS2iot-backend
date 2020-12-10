import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { NoOpLogger } from "../no-op-logger";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";

import configuration from "@config/configuration";
import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { AuthModule } from "@modules/user-management/auth.module";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";

import {
    cleanChirpstackApplications,
    cleanChirpstackDeviceProfiles,
    clearDatabase,
    createDeviceProfileData,
    generateSavedGlobalAdminUser,
    generateValidJwtForUser,
} from "../test-helpers";
import { User } from "@entities/user.entity";
import { AuditLog } from "@services/audit-log.service";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { UserPermissions } from "@dto/permission-organization-application.dto";

describe("ChirpstackDeviceProfileConfiguration", () => {
    let deviceProfileService: DeviceProfileService;
    let app: INestApplication;
    let globalAdminJwt: string;
    let globalAdmin: User;
    const testname = "e2e";
    let fakeUser: AuthenticatedRequest;

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
        moduleFixture.useLogger(new NoOpLogger());
        app = moduleFixture.createNestApplication();
        await app.init();

        deviceProfileService = moduleFixture.get("DeviceProfileService");

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
        fakeUser = {
            user: {
                userId: globalAdmin.id,
                username: globalAdmin.name,
                permissions: new UserPermissions(),
            },
        };
        fakeUser.user.permissions.isGlobalAdmin = true;
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
        await cleanChirpstackApplications(deviceProfileService, testname);
        await cleanChirpstackDeviceProfiles(deviceProfileService, testname, fakeUser);
    });

    afterEach(async () => {
        await cleanChirpstackApplications(deviceProfileService, testname);
        await cleanChirpstackDeviceProfiles(deviceProfileService, testname, fakeUser);
        jest.clearAllMocks();
    });

    it("(GET) /chirpstack/device-profiles/:id - OK", async () => {
        // Arrange
        const original: CreateDeviceProfileDto = createDeviceProfileData();
        const result = await deviceProfileService.createDeviceProfile(
            original,
            globalAdmin.id
        );
        const deviceProfileId = result.data.id;

        // Act
        return await request(app.getHttpServer())
            .get("/chirpstack/device-profiles/" + deviceProfileId)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                expect(response.body).toMatchObject({
                    deviceProfile: {
                        name: original.deviceProfile.name,
                    },
                });
            });
    });

    it("(GET) /chirpstack/device-profiles/ - OK", async () => {
        // Arrange
        const original: CreateDeviceProfileDto = createDeviceProfileData();
        const result1 = await deviceProfileService.createDeviceProfile(
            original,
            globalAdmin.id
        );
        const name1 = `${original.deviceProfile.name}`;

        const changed = original;
        const name2 = `${changed.deviceProfile.name}-changed`;
        changed.deviceProfile.name = name2;
        const result2 = await deviceProfileService.createDeviceProfile(
            changed,
            globalAdmin.id
        );

        // Act
        return await request(app.getHttpServer())
            .get("/chirpstack/device-profiles/")
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                expect(response.body.result).toContainEqual({
                    id: result1.data.id,
                    name: name1,
                    networkServerID: expect.any(String),
                    networkServerName: "OS2iot",
                    organizationID: expect.any(String),
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                    internalOrganizationId: expect.any(Number),
                    createdBy: globalAdmin.id,
                    updatedBy: globalAdmin.id,
                });

                expect(response.body.result).toContainEqual({
                    id: result2.data.id,
                    name: name2,
                    networkServerID: expect.any(String),
                    networkServerName: "OS2iot",
                    organizationID: expect.any(String),
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                    internalOrganizationId: expect.any(Number),
                    createdBy: globalAdmin.id,
                    updatedBy: globalAdmin.id,
                });
            });
    });

    it("(POST) /chirpstack/device-profiles/ - IOT-444 replication", async () => {
        const input = JSON.parse(
            `{"deviceProfile":{"id":"683521bb-8416-40e8-a79a-37fff674897d","name":"","organizationID":"1","networkServerID":"3","supportsClassB":true,"classBTimeout":0,"pingSlotPeriod":0,"pingSlotDR":0,"pingSlotFreq":0,"supportsClassC":false,"classCTimeout":0,"macVersion":"1.0.0","regParamsRevision":"A","rxDelay1":0,"rxDROffset1":0,"rxDataRate2":0,"rxFreq2":0,"factoryPresetFreqs":[],"maxEIRP":0,"maxDutyCycle":0,"supportsJoin":false,"rfRegion":"EU868","supports32BitFCnt":false,"payloadCodec":"","payloadEncoderScript":"","payloadDecoderScript":"","geolocBufferTTL":0,"geolocMinBufferSize":0,"tags":{}}}`
        );

        return await request(app.getHttpServer())
            .post("/chirpstack/device-profiles/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(input)
            .expect(400) // Missing name ...
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                expect(response.body).toMatchObject({
                    chirpstackError: {
                        error: "invalid device-profile name",
                        message: "invalid device-profile name",
                    },
                    success: false,
                });

                expect(auditLogSuccessListener).not.toHaveBeenCalled();
                expect(auditLogFailListener).toHaveBeenCalled();
            });
    });

    it("(POST) /chirpstack/device-profiles/ - OK", async () => {
        // Arrange
        const data: CreateDeviceProfileDto = createDeviceProfileData();

        // Act
        return await request(app.getHttpServer())
            .post("/chirpstack/device-profiles/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(data)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                // Unfortinitly we just get a UUID from Chirpstack
                expect(response.body).toHaveProperty("id");

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });

    it("(PUT) /chirpstack/device-profiles/:id - OK", async () => {
        // Arrange
        const original: CreateDeviceProfileDto = createDeviceProfileData();
        const result = await deviceProfileService.createDeviceProfile(
            original,
            globalAdmin.id
        );
        const deviceProfileId = result.data.id;

        const changed = original;
        changed.deviceProfile.name = `${testname}-changed`;

        // Act
        await request(app.getHttpServer())
            .put("/chirpstack/device-profiles/" + deviceProfileId)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(changed)
            // Assert
            // No body is sent back from Chirpstack :'(
            .expect(204);

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(DELETE) /chirpstack/device-profiles/:id - OK", async () => {
        //Arrange
        const original: CreateDeviceProfileDto = createDeviceProfileData();
        const result = await deviceProfileService.createDeviceProfile(
            original,
            globalAdmin.id
        );
        const deviceProfileId = result.data.id;

        // Act
        return await request(app.getHttpServer())
            .delete("/chirpstack/device-profiles/" + deviceProfileId)
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
