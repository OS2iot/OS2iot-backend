import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import { CreateNetworkServerDto } from "@dto/chirpstack/create-network-server.dto";

describe("ChirpstackServiceProfileConfiguration", () => {
    let chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService;

    let app: INestApplication;
    const testProfileName = "Test-service-profile1";
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ChirpstackAdministrationModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        chirpstackSetupNetworkServerService = moduleFixture.get(
            "ServiceProfileService"
        );
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {});

    afterEach(async () => {});

    it("(GET One) /service-profile/ ", async () => {
        // Arrange
        let name;
        await chirpstackSetupNetworkServerService
            .getNetworkServers(1000, 0)
            .then(response => {
                response.result.some(element => {
                    if (element.name === testProfileName) {
                        name = element.name;
                    }
                });
            });
        // Act
        //Assert
        expect(name).toMatch(testProfileName);
    });

    test.skip("These test will be fixed soon", () => {
        it("(PUT) /service-profile/ ", async () => {
            // Arrange
            let identifier;
            await chirpstackSetupNetworkServerService
                .getNetworkServers(1000, 0)
                .then(response => {
                    response.result.some(element => {
                        element.name === testProfileName,
                            (identifier = element.id);
                    });
                });
            // Act
            const result = await chirpstackSetupNetworkServerService.putNetworkServer(
                chirpstackSetupNetworkServerService.setupNetworkServerData(),
                identifier
            );
            Logger.log(result);
            //Assert
            expect(result).toBe(200);
        });
        it("(DELETE) /service-profile/ fail ", async () => {
            // Arrange
            let identifier;
            await chirpstackSetupNetworkServerService
                .getNetworkServers(1000, 0)
                .then(response => {
                    response.result.some(element => {
                        element.name === testProfileName,
                            (identifier = element.id);
                    });
                });
            // Act
            const result = await chirpstackSetupNetworkServerService.deleteNetworkServer(
                identifier
            );
            //Assert
            expect(result.status).toBe(400);
        });
    });
});
