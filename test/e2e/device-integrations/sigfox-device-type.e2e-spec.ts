import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { SigfoxDeviceTypeModule } from "@modules/device-integrations/sigfox-device-type.module";
import { Organization } from "@entities/organization.entity";
import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateSavedSigFoxGroup,
    generateValidJwtForUser,
    randomMacAddress,
    SIGFOX_DEVICE_TYPE_ID,
} from "../test-helpers";
import configuration from "@config/configuration";
import { AuthModule } from "@modules/user-management/auth.module";
import { ConfigModule } from "@nestjs/config";
import { SigFoxApiDeviceTypeContent } from "@dto/sigfox/external/sigfox-api-device-type-response.dto";
import { CreateSigFoxApiDeviceTypeRequestDto } from "@dto/sigfox/external/create-sigfox-api-device-type-request.dto";
import { SigFoxApiDeviceTypeService } from "@services/sigfox/sigfox-api-device-type.service";
import { SigfoxApiUsersService } from "@services/sigfox/sigfox-api-users.service";

describe("SigfoxDeviceTypeController (e2e)", () => {
    let app: INestApplication;
    let org: Organization;
    let sigFoxGroup: SigFoxGroup;
    let globalAdminJwt: string;
    const contractId = "5f51dce1e833d917cdf9fe93";
    let service: SigFoxApiDeviceTypeService;
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
                SigfoxDeviceTypeModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
        service = moduleFixture.get(SigFoxApiDeviceTypeService.name);
        usersService = moduleFixture.get(SigfoxApiUsersService.name);

        await clearDatabase();

        org = await generateSavedOrganization();
        sigFoxGroup = await generateSavedSigFoxGroup(org);
        // Create user (global admin)
        const user = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(user);
        await deleteExisting(service, usersService, sigFoxGroup);
    });

    afterAll(async () => {
        await deleteExisting(service, usersService, sigFoxGroup);
        await clearDatabase();
        // Ensure clean shutdown
        await app.close();
    });

    it("(GET) /sigfox-device-type - OK", async () => {
        // Arrange

        // Act
        return await request(app.getHttpServer())
            .get(`/sigfox-device-type?groupId=${sigFoxGroup.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                // Assert
                expect(
                    response.body.data.map((x: SigFoxApiDeviceTypeContent) => x.id)
                ).toContainEqual(SIGFOX_DEVICE_TYPE_ID);
            });
    });

    it("(GET) /sigfox-device-type/:id - OK", async () => {
        // Arrange

        // Act
        return await request(app.getHttpServer())
            .get(`/sigfox-device-type/${SIGFOX_DEVICE_TYPE_ID}?groupId=${sigFoxGroup.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .then(response => {
                // Assert
                expect(response.body).toMatchObject({
                    id: SIGFOX_DEVICE_TYPE_ID,
                });
            });
    });

    it("(POST) /sigfox-device-type - OK", async () => {
        // Arrange
        const dto: CreateSigFoxApiDeviceTypeRequestDto = {
            contractId: contractId,
            name: `${NAME_PREFIX} - POST - ${randomMacAddress()}`,
            description: "Created by E2E test",
        };

        // Act
        return await request(app.getHttpServer())
            .post(`/sigfox-device-type?groupId=${sigFoxGroup.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .then(response => {
                // Assert
                expect(response.body).toMatchObject({
                    id: expect.any(String),
                });
            });
    });

    it("(PUT) /sigfox-device-type - OK", async () => {
        // Arrange
        const dto: CreateSigFoxApiDeviceTypeRequestDto = {
            contractId: contractId,
            name: `${NAME_PREFIX} - PUT - ${randomMacAddress()}`,
            description: "Created by E2E test",
        };
        const oldDeviceType = await service.create(sigFoxGroup, dto);
        const newDto = dto;
        newDto.description = "Changed by PUT";

        // Act
        return await request(app.getHttpServer())
            .put(`/sigfox-device-type/${oldDeviceType.id}?groupId=${sigFoxGroup.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(204);
    });
});

const NAME_PREFIX = "E2ETest";

async function deleteExisting(
    service: SigFoxApiDeviceTypeService,
    usersService: SigfoxApiUsersService,
    group: SigFoxGroup
) {
    const sigfoxApiUser = await usersService.getByUserId(group.username, group);
    const deviceTypes = await service.getAllByGroupIds(group, [sigfoxApiUser.group.id]);

    deviceTypes.data.forEach(async x => {
        if (x.name.startsWith(NAME_PREFIX)) {
            await service.delete(group, x.id);
        }
    });
}
