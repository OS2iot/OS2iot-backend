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
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {});

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
                response.result.some(element => {
                    Logger.log(JSON.stringify(element.name));
                    if (element.name === testProfileName) {
                        name = element.name;
                    }
                });
            });
        // Act
        //Assert
        Logger.log("##################");
        Logger.log(result);
        expect(name).toMatch(testProfileName);
    });
    it("(PUT) /network-server/ - expected to fail ", async () => {
        // Arrange
        let identifier;
        await chirpstackSetupNetworkServerService
            .getNetworkServers(1000, 0)
            .then(response => {
                response.result.some(element => {
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
