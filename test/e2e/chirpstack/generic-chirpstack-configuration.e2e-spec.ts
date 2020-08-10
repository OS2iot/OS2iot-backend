import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/chirpstack-network-server.service";
import { CreateNetworkServerDto } from "@dto/chirpstack/create-network-server.dto";

describe("GenericChirpstackConfigurationService1Service", () => {
    let genericChirpstackConfigurationService: ChirpstackSetupNetworkServerService;
    let app: INestApplication;

    const data: CreateNetworkServerDto = genericChirpstackConfigurationService.setupData();

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ChirpstackAdministrationModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    it("get network-server count", async () => {
        const count = genericChirpstackConfigurationService.getNetworkServerCount();
        Logger.warn("Test " + count);
        expect(count).toBe(1);
    });

    it("setup network-server ", async () => {
        genericChirpstackConfigurationService.postNetworkServer(data);
        const count = genericChirpstackConfigurationService.getNetworkServerCount();
        Logger.warn("Test " + count);
        expect(count).toBe(1);
    });
});
