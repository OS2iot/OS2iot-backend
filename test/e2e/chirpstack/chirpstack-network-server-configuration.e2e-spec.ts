import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/chirpstack-network-server.service";
import { CreateNetworkServerDto } from "@dto/chirpstack/create-network-server.dto";

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

    beforeEach(async () => {
        // TODO: 1 hent server id
        /*
        let index = 0;
        const servers = await chirpstackSetupNetworkServerService
            .getNetworkServer(100, 0)
            .then(async response => {
                const tempId = response.data[index].id;
                await chirpstackSetupNetworkServerService.deleteNetworkServer(
                    tempId
                );
                index++;
            });
            */
    });

    afterEach(async () => {
        // Clear data after each test
        //await clearDatabase();
    });

    it("(GETCOUNT) /network-server/ ", async () => {
        return await chirpstackSetupNetworkServerService
            .getNetworkServerCount()
            .then(response => {
                expect(response).toBe("1");
            });
    });
    test.skip("my only true test", () => {
        it("(GET) /network-server/:id ", async () => {
            return await chirpstackSetupNetworkServerService
                .getNetworkServers(100, 0)
                .then(response => {
                    expect(response).toEqual({ result: [], totalCount: "1" });
                });
        });

        it("(POST) network-server ", async () => {
            const data: CreateNetworkServerDto = chirpstackSetupNetworkServerService.setupNetworkServerData();
            return await chirpstackSetupNetworkServerService
                .postNetworkServer(data)
                .then(response => {
                    expect(JSON.stringify(response)).toBe(
                        "[Error: Request failed with status code 409]"
                    );
                });
        });

        it("(DELETE) /network-server/:id ", async () => {
            return await chirpstackSetupNetworkServerService
                .deleteNetworkServer("1")
                .then(response => {
                    expect(response).toBe(""); //TODO fix test
                });
        });

        it("(PUT) /network-server/:id ", async () => {
            const data: CreateNetworkServerDto = chirpstackSetupNetworkServerService.setupNetworkServerData();
            return await chirpstackSetupNetworkServerService
                .putNetworkServer(data, "1")
                .then(response => {
                    Logger.error(response);
                    expect(response).toBe(
                        "[Error: Request failed with status code 404]"
                    );
                });
        });
    });
});
