import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { ServiceProfileDto } from "@dto/chirpstack/service-profile.dto";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";

describe("ChirpstackServiceProfileConfiguration", () => {
    let serviceProfileService: ServiceProfileService;
    let chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService;
    let app: INestApplication;
    const testname = "e2e";
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ChirpstackAdministrationModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        serviceProfileService = moduleFixture.get("ServiceProfileService");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    afterEach(async () => {
        await serviceProfileService
            .findAllServiceProfiles(1000, 0)
            .then(response => {
                response.result.forEach(element => {
                    if (element.name === testname) {
                        serviceProfileService.deleteServiceProfile(element.id);
                    }
                });
            });
    });

    it("(POST) /service-profiles/  OK", async () => {
        //Arrange & Act
        const data: CreateServiceProfileDto = createServiceProfileData();
        Logger.error(data);
        const result = await serviceProfileService.createServiceProfile(data);

        //Logger.error(JSON.stringify(result));
        //Assert
        expect(result.status).toEqual(200);
    });

    it("(PUT) /service-profiles/  OK", async () => {
        //Arrange & Act
        const data: CreateServiceProfileDto = createServiceProfileData();
        Logger.error(data);
        await serviceProfileService.createServiceProfile(data);

        await serviceProfileService
            .findAllServiceProfiles(1000, 0)
            .then(response => {
                response.result.forEach(async element => {
                    if (element.name === testname) {
                        const result = await serviceProfileService.updateServiceProfile(
                            data,
                            element.id
                        );
                        expect(result.status).toEqual(200);
                    }
                });
            });
    });

    it("(DELETE) /service-profiles/  OK", async () => {
        //Arrange & Act
        const data: CreateServiceProfileDto = createServiceProfileData();
        Logger.error(data);
        await serviceProfileService.createServiceProfile(data);

        await serviceProfileService
            .findAllServiceProfiles(1000, 0)
            .then(response => {
                response.result.forEach(async element => {
                    if (element.name === testname) {
                        const result = await serviceProfileService.deleteServiceProfile(
                            element.id
                        );
                        expect(result.status).toEqual(200);
                    }
                });
            });
    });

    /* async function getNetworkServerId(): Promise<string> {
        let id: string;
        Logger.error("#############");
        await chirpstackSetupNetworkServerService
            .getNetworkServers(1000, 0)
            .then(response => {
                response.result.forEach(element => {
                    if (element.name === "OS2iot") {
                        Logger.log("name " + element.name);
                        id = JSON.stringify(element.id);
                    }
                });
            });
        Logger.log("id " + id);
        return id;
    } */
    function createServiceProfileData(): CreateServiceProfileDto {
        // const networkServerId = getNetworkServerId();
        const serviceProfileDto: ServiceProfileDto = {
            name: testname,
            networkServerID: "3", //networkServerId
            organizationID: "1",
            prAllowed: true,
            raAllowed: true,
            reportDevStatusBattery: true,
            reportDevStatusMargin: true,
            ulRatePolicy: "DROP",
            addGWMetaData: true,
            devStatusReqFreq: 0,
            dlBucketSize: 0,
            dlRate: 0,
            drMax: 0,
            drMin: 0,
            hrAllowed: true,
            minGWDiversity: 0,
            nwkGeoLoc: true,
            targetPER: 0,
            ulBucketSize: 0,
            ulRate: 0,
        };

        const serviceProfile: CreateServiceProfileDto = {
            serviceProfile: serviceProfileDto,
        };

        return serviceProfile;
    }
});
