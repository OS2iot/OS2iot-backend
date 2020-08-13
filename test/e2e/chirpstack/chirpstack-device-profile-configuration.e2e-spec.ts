import { Test, TestingModule } from "@nestjs/testing";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { INestApplication, Logger } from "@nestjs/common";
import { DeviceProfileService } from "@services/chirpstack/service-profile.service";
import { CreateDeviceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { DeviceProfileDto } from "@dto/chirpstack/service-profile.dto";

describe("ChirpstackDeviceProfileConfiguration", () => {
    let deviceProfileService: DeviceProfileService;
    let app: INestApplication;
    const testname = "e2e";
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ChirpstackAdministrationModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        deviceProfileService = moduleFixture.get("DeviceProfileService");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    afterEach(async () => {
        await deviceProfileService
            .findAllDeviceProfiles(1000, 0)
            .then(response => {
                response.result.forEach(element => {
                    if (element.name === testname) {
                        deviceProfileService.deleteDeviceProfile(element.id);
                    }
                });
            });
    });

    it("(POST) /service-profiles/  OK", async () => {
        //Arrange & Act
        const data: CreateDeviceProfileDto = createDeviceProfileData();
        Logger.error(data);
        const result = await deviceProfileService.createDeviceProfile(data);

        //Logger.error(JSON.stringify(result));
        //Assert
        expect(result.status).toEqual(200);
    });

    it("(PUT) /service-profiles/  OK", async () => {
        //Arrange & Act
        const data: CreateDeviceProfileDto = createDeviceProfileData();
        Logger.error(data);
        await deviceProfileService.createDeviceProfile(data);

        await deviceProfileService
            .findAllDeviceProfiles(1000, 0)
            .then(response => {
                response.result.forEach(async element => {
                    if (element.name === testname) {
                        const result = await deviceProfileService.updateDeviceProfile(
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
        const data: CreateDeviceProfileDto = createDeviceProfileData();
        Logger.error(data);
        await deviceProfileService.createDeviceProfile(data);

        await deviceProfileService
            .findAllDeviceProfiles(1000, 0)
            .then(response => {
                response.result.forEach(async element => {
                    if (element.name === testname) {
                        const result = await deviceProfileService.deleteDeviceProfile(
                            element.id
                        );
                        expect(result.status).toEqual(200);
                    }
                });
            });
    });

    function createDeviceProfileData(): CreateDeviceProfileDto {
        const deviceProfileDto: DeviceProfileDto = {
            name: "e2e",
            classBTimeout: 1,
            classCTimeout: 1,
            factoryPresetFreqs: [1],
            geolocBufferTTL: 1,
            geolocMinBufferSize: 1,
            macVersion: "string",
            maxDutyCycle: 1,
            maxEIRP: 1,
            networkServerID: "string",
            organizationID: "string",
            payloadCodec: "string",
            payloadDecoderScript: "string",
            payloadEncoderScript: "string",
            pingSlotDR: 1,
            pingSlotFreq: 1,
            pingSlotPeriod: 1,
            regParamsRevision: "string",
            rfRegion: "string",
            rxDROffset1: 1,
            rxDataRate2: 1,
            rxDelay1: 1,
            rxFreq2: 1,
            supports32BitFCnt: false,
            supportsClassB: false,
            supportsClassC: false,
            supportsJoin: false,
            tags: {},
        };

        const deviceProfile: CreateDeviceProfileDto = {
            deviceProfile: deviceProfileDto,
        };

        return deviceProfile;
    }
});
