import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication } from "@nestjs/common";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";

describe("ChirpstackServiceProfileConfiguration", () => {
    let serviceProfileService: ServiceProfileService;
    let app: INestApplication;
    const testProfileName = "Test-service-profile1";
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

    beforeEach(async () => {});

    afterEach(async () => {});

    it("(POST) /service-profile/  OK", async () => {
        //Arrange & Act
        const result = await serviceProfileService.createServiceProfile(
            serviceProfileService.setupServiceProfileData(testProfileName)
        );
        //Assert
        expect(result).toEqual(201);
    });

    it("(GET One) /service-profile/ ", async () => {
        // Arrange
        let identifier;
        await serviceProfileService
            .findAllServiceProfiles(1000, 0)
            .then(response => {
                response.result.some(element => {
                    element.name === testProfileName, (identifier = element.id);
                });
            });
        // Act
        const result: CreateServiceProfileDto = await serviceProfileService.findOneServiceProfileById(
            identifier
        );
        //Assert
        expect(result.serviceProfile.name).toMatch(testProfileName);
    });

    it("(PUT) /service-profile/ ", async () => {
        // Arrange
        let identifier;
        await serviceProfileService
            .findAllServiceProfiles(1000, 0)
            .then(response => {
                response.result.some(element => {
                    element.name === testProfileName, (identifier = element.id);
                });
            });
        // Act
        const result = await serviceProfileService.updateServiceProfile(
            serviceProfileService.setupServiceProfileData(testProfileName + 1),
            identifier
        );
        //Assert
        expect(result).toBe(201);
    });

    it("(DELETE) /service-profile/ ", async () => {
        // Arrange
        let identifier;
        await serviceProfileService
            .findAllServiceProfiles(1000, 0)
            .then(response => {
                response.result.some(element => {
                    element.name === testProfileName, (identifier = element.id);
                });
            });
        // Act
        const result = await serviceProfileService.deleteServiceProfile(
            identifier
        );
        //Assert
        expect(JSON.stringify(result)).toBe(JSON.stringify({}));
    });
});
