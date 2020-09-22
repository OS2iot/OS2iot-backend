import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication } from "@nestjs/common";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { ServiceProfileDto } from "@dto/chirpstack/service-profile.dto";
import * as request from "supertest";

describe("ChirpstackServiceProfileConfiguration", () => {
    let serviceProfileService: ServiceProfileService;
    let app: INestApplication;
    const testname = "e2e";
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ChirpstackAdministrationModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        serviceProfileService = moduleFixture.get("ServiceProfileService");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    afterEach(async () => {
        await serviceProfileService
            .findAllServiceProfiles(1000, 0)
            .then(response => {
                response.result.forEach(async serviceProfile => {
                    if (serviceProfile.name.startsWith(testname)) {
                        await serviceProfileService.deleteServiceProfile(
                            serviceProfile.id
                        );
                    }
                });
            });
    });

    it("(POST) /chirpstack/service-profiles/ - OK", async () => {
        // Arrange
        const data: CreateServiceProfileDto = await createServiceProfileData();

        // Act
        return await request(app.getHttpServer())
            .post("/chirpstack/service-profiles/")
            .send(data)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                // Unfortinitly we just get a UUID from Chirpstack
                expect(response.body).toHaveProperty("id");
            });
    });

    it("(GET) /chirpstack/service-profiles/:id - OK", async () => {
        // Arrange
        const data: CreateServiceProfileDto = await createServiceProfileData();
        const result = await serviceProfileService.createServiceProfile(data);
        const serviceProfileId = result.data.id;

        // Act
        return await request(app.getHttpServer())
            .get("/chirpstack/service-profiles/" + serviceProfileId)
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
        const data: CreateServiceProfileDto = await createServiceProfileData();
        const result1 = await serviceProfileService.createServiceProfile(data);

        data.serviceProfile.name = `${testname}-changed`;
        const result2 = await serviceProfileService.createServiceProfile(data);

        // Act
        return await request(app.getHttpServer())
            .get("/chirpstack/service-profiles/")
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
        const original: CreateServiceProfileDto = await createServiceProfileData();
        const result = await serviceProfileService.createServiceProfile(
            original
        );
        const serviceProfileId = result.data.id;

        const changed = original;
        changed.serviceProfile.name = `${testname}-changed`;

        // Act
        return await request(app.getHttpServer())
            .put("/chirpstack/service-profiles/" + serviceProfileId)
            .send(changed)
            // Assert
            // No body is sent back from Chirpstack :'(
            .expect(204);
    });

    it("(DELETE) /chirpstack/service-profiles/:id - OK", async () => {
        //Arrange
        const data: CreateServiceProfileDto = await createServiceProfileData();
        const result = await serviceProfileService.createServiceProfile(data);
        const serviceProfileId = result.data.id;

        // Act
        return await request(app.getHttpServer())
            .delete("/chirpstack/service-profiles/" + serviceProfileId)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                expect(response.body).toMatchObject({
                    affected: 1,
                });
            });
    });

    async function createServiceProfileData(): Promise<
        CreateServiceProfileDto
    > {
        const serviceProfileDto: ServiceProfileDto = {
            name: testname,
            prAllowed: true,
            raAllowed: true,
            reportDevStatusBattery: true,
            reportDevStatusMargin: true,
            ulRatePolicy: "DROP",
            addGWMetaData: true,
            devStatusReqFreq: 0,
            dlBucketSize: 0,
            dlRate: 0,
            drMax: 0,
            drMin: 0,
            hrAllowed: true,
            minGWDiversity: 0,
            nwkGeoLoc: true,
            targetPER: 0,
            ulBucketSize: 0,
            ulRate: 0,
        };

        const serviceProfile: CreateServiceProfileDto = {
            serviceProfile: serviceProfileDto,
        };

        return serviceProfile;
    }
});
