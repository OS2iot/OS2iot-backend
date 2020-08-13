import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";

describe("ChirpstackServiceProfileConfiguration", () => {
    let chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService;
    let app: INestApplication;
    const testProfileName = "OS2iot";

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
        await chirpstackSetupNetworkServerService
            .getNetworkServers(1000, 0)
            .then(response => {
                response.result.forEach(element => {
                    if (element.name === testProfileName) {
                        chirpstackSetupNetworkServerService.deleteNetworkServer(
                            element.id
                        );
                    }
                });
            });
        await app.close();
    });

    beforeEach(async () => {
        //onModuleInit is not called in tests. thus we have to setup the server before each test
        chirpstackSetupNetworkServerService.bootstrapChirpstackNetworkServerConfiguration();
    });

    afterEach(async () => {});

    it("(GET count) /network-server/ ", async () => {
        // Arrange
        let name;
        const result = await chirpstackSetupNetworkServerService.getNetworkServerCount();
        // Act & Assert
        expect(result).toBe("1");
    });

    it("(GET One) /network-server/ ", async () => {
        // Arrange
        let name;
        const result = await chirpstackSetupNetworkServerService
            .getNetworkServers(1000, 0)
            .then(response => {
                response.result.forEach(element => {
                    if (element.name === testProfileName) {
                        name = element.name;
                    }
                });
            });

        expect(name).toMatch(testProfileName);
    });

    it("(PUT) /network-server/ - expected to fail ", async () => {
        // Arrange
        let identifier;
        await chirpstackSetupNetworkServerService
            .getNetworkServers(1000, 0)
            .then(response => {
                response.result.forEach(element => {
                    element.name === testProfileName, (identifier = element.id);
                });
            });
        // Act
        const result = await chirpstackSetupNetworkServerService.putNetworkServer(
            chirpstackSetupNetworkServerService.setupNetworkServerData(),
            identifier
        );
        //Assert
        expect(result.status).toBe(200);
    });
});
