import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/chirpstack-network-server.service";
import { CreateNetworkServerDto } from "@dto/create-network-server.dto";

describe("GenericChirpstackConfigurationService1Service", () => {
    let genericChirpstackConfigurationService: ChirpstackSetupNetworkServerService;
    let app: INestApplication;
    const chirpstackNetworkServerName =
        "os2iot-docker_chirpstack-network-server_1:8000";
    const chirpstackNetworkServer1 = "chirpstack-network-server:8000";

    const createNetworkServerDto: CreateNetworkServerDto = {
        name: "OS2iot",
        server: chirpstackNetworkServerName,
        /*
        caCert: "",
        gatewayDiscoveryDR: 0,
        gatewayDiscoveryEnabled: false,
        gatewayDiscoveryInterval: 0,
        gatewayDiscoveryTXFrequency: 0,
        routingProfileCACert: "",
        routingProfileTLSCert: "",
        routingProfileTLSKey: "",
        tlsCert: "",
        tlsKey: "",
        */
    };

    const data: string =
        '{"networkServer":' + JSON.stringify(createNetworkServerDto) + "}";

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
