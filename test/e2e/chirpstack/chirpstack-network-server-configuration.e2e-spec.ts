import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";

describe("ChirpstackSetupNetworkServerService", () => {
    let chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService;
    let app: INestApplication;
    const testServerName = "OS2iot";

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ChirpstackAdministrationModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        chirpstackSetupNetworkServerService = moduleFixture.get(
            "ChirpstackSetupNetworkServerService"
        );
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        //onModuleInit is not called in tests. thus we have to setup the server before each test
        chirpstackSetupNetworkServerService.bootstrapChirpstackNetworkServerConfiguration();
    });

    afterEach(async () => {
        await chirpstackSetupNetworkServerService
            .getNetworkServers(1000, 0)
            .then(response => {
                response.result.forEach(element => {
                    if (element.name === testServerName) {
                        chirpstackSetupNetworkServerService.deleteNetworkServer(
                            element.id
                        );
                    }
                });
            });
    });

    it("(GET count) /network-server/ ", async () => {
        // Act
        const result = await chirpstackSetupNetworkServerService.getNetworkServerCount();
        // Assert
        expect(result).toBe("1");
    });

    it("(GET One) /network-server/ ", async () => {
        // Arrange
        let name;

        await chirpstackSetupNetworkServerService
            .getNetworkServers(1000, 0)
            .then(response => {
                response.result.forEach(element => {
                    if (element.name === testServerName) {
                        name = element.name;
                    }
                });
            });
        expect(name).toMatch(testServerName);
    });
});
