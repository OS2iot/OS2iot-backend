import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";

import configuration from "@config/configuration";
import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import { DeviceProfileDto } from "@dto/chirpstack/device-profile.dto";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { AuthModule } from "@modules/user-management/auth.module";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";

import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateValidJwtForUser,
} from "../test-helpers";

describe("ChirpstackDeviceProfileConfiguration", () => {
    let deviceProfileService: DeviceProfileService;
    let app: INestApplication;
    let globalAdminJwt: string;
    const testname = "e2e";

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
        app = moduleFixture.createNestApplication();
        await app.init();

        deviceProfileService = moduleFixture.get("DeviceProfileService");
    });

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
        // Create user (global admin)
        const user = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(user);
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    afterEach(async () => {
        await deviceProfileService.findAllDeviceProfiles(1000, 0).then(response => {
            response.result.forEach(async deviceProfile => {
                if (deviceProfile.name.startsWith(testname)) {
                    await deviceProfileService.deleteDeviceProfile(deviceProfile.id);
                }
            });
        });
    });

    it("(GET) /chirpstack/device-profiles/:id - OK", async () => {
        // Arrange
        const original: CreateDeviceProfileDto = await createDeviceProfileData();
        const result = await deviceProfileService.createDeviceProfile(original);
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
                        name: testname,
                    },
                });
            });
    });

    it("(GET) /chirpstack/device-profiles/ - OK", async () => {
        // Arrange
        const original: CreateDeviceProfileDto = await createDeviceProfileData();
        const result1 = await deviceProfileService.createDeviceProfile(original);

        const changed = original;
        changed.deviceProfile.name = `${testname}-changed`;
        const result2 = await deviceProfileService.createDeviceProfile(changed);

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
                    name: testname,
                    networkServerID: expect.any(String),
                    networkServerName: "OS2iot",
                    organizationID: expect.any(String),
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                });

                expect(response.body.result).toContainEqual({
                    id: result2.data.id,
                    name: `${testname}-changed`,
                    networkServerID: expect.any(String),
                    networkServerName: "OS2iot",
                    organizationID: expect.any(String),
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
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
            });
    });

    it("(POST) /chirpstack/device-profiles/ - OK", async () => {
        // Arrange
        const data: CreateDeviceProfileDto = await createDeviceProfileData();

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
            });
    });

    it("(PUT) /chirpstack/device-profiles/:id - OK", async () => {
        // Arrange
        const original: CreateDeviceProfileDto = await createDeviceProfileData();
        const result = await deviceProfileService.createDeviceProfile(original);
        const deviceProfileId = result.data.id;

        const changed = original;
        changed.deviceProfile.name = `${testname}-changed`;

        // Act
        return await request(app.getHttpServer())
            .put("/chirpstack/device-profiles/" + deviceProfileId)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(changed)
            // Assert
            // No body is sent back from Chirpstack :'(
            .expect(204);
    });

    it("(DELETE) /chirpstack/device-profiles/:id - OK", async () => {
        //Arrange
        const original: CreateDeviceProfileDto = await createDeviceProfileData();
        const result = await deviceProfileService.createDeviceProfile(original);
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
            });
    });

    async function createDeviceProfileData(): Promise<CreateDeviceProfileDto> {
        const deviceProfileDto: DeviceProfileDto = {
            name: "e2e",
            macVersion: "1.0.3",
            regParamsRevision: "A",
            maxEIRP: 1,
        };

        const deviceProfile: CreateDeviceProfileDto = {
            deviceProfile: deviceProfileDto,
            organizationId: 1,
        };

        return deviceProfile;
    }
});
