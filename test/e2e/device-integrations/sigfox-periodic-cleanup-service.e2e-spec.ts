import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { NoOpLogger } from "../no-op-logger";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SigFoxAdministrationModule } from "@modules/device-integrations/sigfox-administration.module";
import { GenericSigfoxAdministationService } from "@services/sigfox/generic-sigfox-administation.service";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { PeriodicSigFoxCleanupService } from "@services/sigfox/periodic-sigfox-cleanup.service";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import {
    clearDatabase,
    generateSavedApplication,
    generateSavedOrganization,
    generateSavedSigfoxDevice,
    generateSavedSigfoxDeviceFromData,
    generateSavedSigFoxGroup,
    generateSigfoxDevice,
    SIGFOX_DEVICE_ID,
    SIGFOX_DEVICE_ID_2,
} from "../test-helpers";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";
import { getManager, Repository } from "typeorm";
import { SigFoxDevice } from "@entities/sigfox-device.entity";

describe("PeriodicSigFoxCleanupService (e2e)", () => {
    let app: INestApplication;
    let service: PeriodicSigFoxCleanupService;
    let sigfoxApiDeviceService: SigFoxApiDeviceService;
    let repository: Repository<SigFoxDevice>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: "postgres",
                    host: "host.docker.internal",
                    port: 5433,
                    username: "os2iot",
                    password: "toi2so",
                    database: "os2iot-e2e",
                    synchronize: true,
                    logging: false,
                    autoLoadEntities: true,
                }),
                IoTDeviceModule,
            ],
        }).compile();
        moduleFixture.useLogger(new NoOpLogger());

        app = moduleFixture.createNestApplication();

        await app.init();
        service = moduleFixture.get("PeriodicSigFoxCleanupService");
        sigfoxApiDeviceService = moduleFixture.get("SigFoxApiDeviceService");
        repository = moduleFixture.get("SigFoxDeviceRepository");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        await clearDatabase();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    it("cleanupDevicesRemovedFromSigFoxBackend() - create 4, remove 2 devices", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const group = await generateSavedSigFoxGroup(org);
        const application = await generateSavedApplication(org);
        // const backendDevice1 = await sigfoxApiDeviceService.getByIdSimple(
        //     group,
        //     SIGFOX_DEVICE_ID
        // );
        const backendDevice2 = await sigfoxApiDeviceService.getByIdSimple(
            group,
            SIGFOX_DEVICE_ID_2
        );
        // const realDevice = await generateSavedSigfoxDeviceFromData(
        //     application,
        //     backendDevice1
        // );
        const realDevice2 = await generateSavedSigfoxDeviceFromData(
            application,
            backendDevice2
        );
        const fakeDevice = generateSigfoxDevice(application);
        fakeDevice.deviceId = "DEADBABE";
        await getManager().save(fakeDevice);
        const fakeDevice2 = generateSigfoxDevice(application);
        fakeDevice2.deviceId = "CAFEBEEF";
        await getManager().save(fakeDevice2);

        // Act
        await service.cleanupDevicesRemovedFromSigFoxBackend();

        // Assert
        const devices = await repository.find();
        expect(devices.length).toBe(1);
        // expect(devices[0]).toMatchObject({
        //     id: realDevice.id,
        // });
        expect(devices[0]).toMatchObject({
            id: realDevice2.id,
        });
    });
});
