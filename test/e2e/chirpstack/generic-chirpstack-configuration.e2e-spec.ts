import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/chirpstack-network-server.service";
import { CreateNetworkServerDto } from "@dto/chirpstack/create-network-server.dto";

// eslint-disable-next-line max-lines-per-function
describe("GenericChirpstackConfigurationService1Service", () => {
    let genericChirpstackConfigurationService: ChirpstackSetupNetworkServerService;
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ChirpstackAdministrationModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        genericChirpstackConfigurationService = moduleFixture.get(
            "ChirpstackSetupNetworkServerService"
        );
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    test.skip("my only true test", () => {
        it("get network-server count", async () => {
            const count = genericChirpstackConfigurationService.getNetworkServerCount();
            Logger.warn("Test " + count);
            expect(count).toBe(1);
        });

        it("setup network-server ", async () => {
            const data: CreateNetworkServerDto = genericChirpstackConfigurationService.setupData();
            genericChirpstackConfigurationService.postNetworkServer(data);
            const count = genericChirpstackConfigurationService.getNetworkServerCount();
            Logger.warn("Test " + count);
            expect(count).toBe(1);
        });
    });
});
