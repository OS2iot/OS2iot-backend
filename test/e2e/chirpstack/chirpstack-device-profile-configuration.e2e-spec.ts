import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication } from "@nestjs/common";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";
import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import { DeviceProfileDto } from "@dto/chirpstack/device-profile.dto";
import { getNetworkServerId } from "../test-helpers";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import * as request from "supertest";

describe("ChirpstackDeviceProfileConfiguration", () => {
    let deviceProfileService: DeviceProfileService;
    let chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService;
    let app: INestApplication;
    const testname = "e2e";

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ChirpstackAdministrationModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        deviceProfileService = moduleFixture.get("DeviceProfileService");
        chirpstackSetupNetworkServerService = moduleFixture.get(
            "ChirpstackSetupNetworkServerService"
        );
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    afterEach(async () => {
        await deviceProfileService
            .findAllDeviceProfiles(1000, 0)
            .then(response => {
                response.result.forEach(deviceProfile => {
                    if (deviceProfile.name.startsWith(testname)) {
                        deviceProfileService.deleteDeviceProfile(
                            deviceProfile.id
                        );
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
        const result1 = await deviceProfileService.createDeviceProfile(
            original
        );

        const changed = original;
        changed.deviceProfile.name = `${testname}-changed`;
        const result2 = await deviceProfileService.createDeviceProfile(changed);

        // Act
        return await request(app.getHttpServer())
            .get("/chirpstack/device-profiles/")
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                expect(response.body.result).toContainEqual({
                    id: result1.data.id,
                    name: testname,
                    networkServerID: expect.any(String),
                    networkServerName: "OS2iot",
                    organizationID: "1",
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                });

                expect(response.body.result).toContainEqual({
                    id: result2.data.id,
                    name: `${testname}-changed`,
                    networkServerID: expect.any(String),
                    networkServerName: "OS2iot",
                    organizationID: "1",
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                });
            });
    });

    it("(POST) /chirpstack/device-profiles/ - OK", async () => {
        // Arrange
        const data: CreateDeviceProfileDto = await createDeviceProfileData();

        // Act
        return await request(app.getHttpServer())
            .post("/chirpstack/device-profiles/")
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
        const networkServerId = await getNetworkServerId(
            chirpstackSetupNetworkServerService
        );
        const deviceProfileDto: DeviceProfileDto = {
            name: "e2e",
            macVersion: "1.0.3",
            networkServerID: networkServerId,
            organizationID: "1",
            regParamsRevision: "A",
        };

        const deviceProfile: CreateDeviceProfileDto = {
            deviceProfile: deviceProfileDto,
        };

        return deviceProfile;
    }
});
