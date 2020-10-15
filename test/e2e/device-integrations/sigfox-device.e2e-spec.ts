import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { Organization } from "@entities/organization.entity";
import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateSavedSigFoxGroup,
    generateValidJwtForUser,
    SIGFOX_DEVICE_TYPE_ID,
} from "../test-helpers";
import configuration from "@config/configuration";
import { AuthModule } from "@modules/user-management/auth.module";
import { ConfigModule } from "@nestjs/config";
import { SigfoxApiUsersService } from "@services/sigfox/sigfox-api-users.service";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";
import { SigfoxDeviceModule } from "@modules/device-integrations/sigfox-device.module";
import { CreateSigFoxApiDeviceRequestDto } from "@dto/sigfox/external/create-sigfox-api-device-request.dto";

describe("SigfoxDeviceService (e2e)", () => {
    let app: INestApplication;
    let org: Organization;
    let sigfoxGroup: SigFoxGroup;
    let globalAdminJwt: string;
    let service: SigFoxApiDeviceService;
    let usersService: SigfoxApiUsersService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ load: [configuration] }),
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
                AuthModule,
                SigfoxDeviceModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
        service = moduleFixture.get(SigFoxApiDeviceService.name);
        usersService = moduleFixture.get(SigfoxApiUsersService.name);

        await clearDatabase();

        org = await generateSavedOrganization();
        sigfoxGroup = await generateSavedSigFoxGroup(org);
        // Create user (global admin)
        const user = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(user);
    });

    afterAll(async () => {
        await clearDatabase();
        // Ensure clean shutdown
        await app.close();
    });

    it.skip("Unsubscribe + Delete - OK", async () => {
        // Arrange
        // Act
        await service.delete(sigfoxGroup, DEVICE_ID);
        // Assert
    });

    it.skip("Create SigFox device - OK", async () => {
        // Arrange
        const dto: CreateSigFoxApiDeviceRequestDto = {
            name: `${NAME_PREFIX} - SenseIT`,
            id: DEVICE_ID,
            pac: DEVICE_PAC,
            deviceTypeId: SIGFOX_DEVICE_TYPE_ID,
            prototype: false,
            productCertificate: {
                key: DEVICE_PRODUCT_CERTIFICATE,
            },
        };
        // Act
        const res = await service.create(sigfoxGroup, dto);
        // Assert
        expect(res).toMatchObject({
            id: expect.any(String),
        });
    });
});

const NAME_PREFIX = "E2ETest";
const DEVICE_ID = "B443A5";
const DEVICE_PAC = "4211BB1DC71BC88E";
const DEVICE_PRODUCT_CERTIFICATE = "P_0006_321A_01";
