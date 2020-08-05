import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/setup-network-server/chirpstack-network-server.service";

describe("GenericChirpstackConfigurationService1Service", () => {
    let genericChirpstackConfigurationService: ChirpstackSetupNetworkServerService;
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration/generic-chirpstack-configuration.service";
import { INestApplication } from "@nestjs/common";

describe("GenericChirpstackConfigurationService1Service", () => {
    let genericChirpstackConfigurationService: GenericChirpstackConfigurationService;
    let app: INestApplication;
    const chirpstackNetworkServerName =
        "os2iot-docker_chirpstack-network-server_1:8000";
    const endpoint = "network-servers";
    const data: string = //TODO: skriv om til at bruge en DTO
        '{"networkServer": { "name": "' +
        chirpstackNetworkServerName +
        '", "server": "' +
        chirpstackNetworkServerName +
        '"}}';
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
        const count = genericChirpstackConfigurationService.getCount(endpoint);
        Logger.warn("Test " + count);
        expect(count).toBe(1);
    });

    it("setup network-server ", async () => {
        genericChirpstackConfigurationService.post(endpoint, data);
        const count = genericChirpstackConfigurationService.getCount(endpoint);
        Logger.warn("Test " + count);
        expect(count).toBe(1);
    });
});
