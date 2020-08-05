import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/chirpstack-network-server.service";
import { SendStatus } from "@enum/send-status.enum";

describe("ChirpstackSetupNetworkServerService", () => {
    let chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService;
    let app: INestApplication;

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

    it("Get network-server count", async () => {
        const count = await chirpstackSetupNetworkServerService.getCountNetworkServer();
        Logger.error(count);
        expect(count).toBe("1");
    });

    it("Get network-server ", async () => {
        const res = await chirpstackSetupNetworkServerService.getNetworkServer(
            0,
            10
        );
        Logger.error(res);
        expect(res).toBe(SendStatus.OK);
    });

    it("Delete network-server ", async () => {
        const res = await chirpstackSetupNetworkServerService.deleteNetworkServer(
            1
        );
        Logger.error(res);
        expect(res).toBe(SendStatus.OK);
    });

    it("Post network-server ", async () => {
        const data: string = chirpstackSetupNetworkServerService.setupData();
        const res = await JSON.stringify(
            chirpstackSetupNetworkServerService.postNetworkServer(data)
        );
        Logger.error(res);
        expect(res).toBe(SendStatus.OK);
    });

    it("Put network-server ", async () => {
        const data: string = chirpstackSetupNetworkServerService.setupData();
        const res = await chirpstackSetupNetworkServerService.putNetworkServer(
            data,
            1
        );
        Logger.error(res);
        expect(res).toBe(
            JSON.parse("[Error: Request failed with status code 404]")
        );
    });
});
