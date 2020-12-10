import { INestApplication, Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { NoOpLogger } from "../no-op-logger";

import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";

describe("ChirpstackSetupNetworkServerService", () => {
    let chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService;
    let app: INestApplication;
    const testServerName = "OS2iot";

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ChirpstackAdministrationModule],
        }).compile();
        moduleFixture.useLogger(new NoOpLogger());
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
        chirpstackSetupNetworkServerService.networkServerName = testServerName;
        //onModuleInit is not called in tests. thus we have to setup the server before each test
        await chirpstackSetupNetworkServerService.bootstrapChirpstackNetworkServerConfiguration();
    });

    afterEach(async () => {
        try {
            await chirpstackSetupNetworkServerService
                .getNetworkServers(1000, 0)
                .then(response => {
                    response.result.forEach(async networkServer => {
                        if (networkServer.name.startsWith(testServerName)) {
                            await chirpstackSetupNetworkServerService.deleteNetworkServer(
                                networkServer.id
                            );
                        }
                    });
                });
        } catch (err) {
            Logger.warn("Clean-up failed ...", err);
        }
    });

    it("Check that at least one Network Server exists", async () => {
        // Act
        const result = await chirpstackSetupNetworkServerService.getNetworkServers(
            100,
            0
        );
        // Assert
        expect(+result.totalCount).toBeGreaterThanOrEqual(1);
    });
});
