import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SigFoxAdministrationModule } from "@modules/device-integrations/sigfox-administration.module";
import { GenericSigfoxAdministationService } from "@services/sigfox/generic-sigfox-administation.service";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { PeriodicSigFoxCleanupService } from "@services/sigfox/periodic-sigfox-cleanup.service";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import {
    clearDatabase,
    generateSavedApplication,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateSavedSigfoxDevice,
    generateSavedSigfoxDeviceFromData,
    generateSavedSigFoxGroup,
    generateSigfoxDevice,
    generateValidJwtForUser,
    SIGFOX_DEVICE_ID,
    SIGFOX_DEVICE_ID_2,
} from "../test-helpers";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";
import { getManager, Repository } from "typeorm";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { SigfoxDeviceModule } from "@modules/device-integrations/sigfox-device.module";

describe("SigfoxApiDeviceController (e2e)", () => {
    let app: INestApplication;
    let service: PeriodicSigFoxCleanupService;
    let sigfoxApiDeviceService: SigFoxApiDeviceService;
    let repository: Repository<SigFoxDevice>;
    let globalAdminJwt: string;

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
                SigfoxDeviceModule,
            ],
        }).compile();

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

    afterEach(async () => {
        await clearDatabase();
    });

    beforeEach(async () => {
        await clearDatabase();
        // Create user (global admin)
        const user = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(user);
    });

    it("(GET) /sigfox-api-device/ - Get all", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const group = await generateSavedSigFoxGroup(org);
        const application = await generateSavedApplication(org);

        let beforeCount: number;
        await request(app.getHttpServer())
            .get(`/sigfox-api-device?groupId=${group.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                beforeCount = response.body.data.length;
            });

        const backendDevice2 = await sigfoxApiDeviceService.getByIdSimple(
            group,
            SIGFOX_DEVICE_ID_2
        );
        await generateSavedSigfoxDeviceFromData(application, backendDevice2);

        // Act
        return await request(app.getHttpServer())
            .get(`/sigfox-api-device?groupId=${group.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                // Assert
                expect(response.body.data).toHaveLength(beforeCount - 1);
            });
    });
});
