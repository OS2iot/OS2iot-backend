import { INestApplication, Logger } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";

import configuration from "@config/configuration";
import { CreateGatewayDto } from "@dto/chirpstack/create-gateway.dto";
import { SingleGatewayResponseDto } from "@dto/chirpstack/single-gateway-response.dto";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { AuthModule } from "@modules/user-management/auth.module";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";

import {
    gatewayNamePrefix,
    generateSavedGlobalAdminUser,
    generateValidJwtForUser,
    makeCreateGatewayDto,
} from "../test-helpers";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";

// eslint-disable-next-line max-lines-per-function
describe("ChirpstackGatewayController (e2e)", () => {
    let service: ChirpstackGatewayService;
    let chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService;
    let app: INestApplication;
    let globalAdminJwt: string;

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
                ChirpstackAdministrationModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        service = moduleFixture.get("ChirpstackGatewayService");
        chirpstackSetupNetworkServerService = moduleFixture.get(
            "ChirpstackSetupNetworkServerService"
        );
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        // Delete all gateways created in E2E tests:
        const existing = await service.listAllPaginated(1000, 0);
        existing.result.forEach(async element => {
            if (element.name.startsWith(gatewayNamePrefix)) {
                Logger.debug(`Found ${element.name}, deleting.`);
                await service.deleteGateway(element.id);
            }
        });
        // Create user (global admin)
        const user = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(user);
    });

    async function createGateway(): Promise<string> {
        return (await createGatewayReturnDto()).gateway.id;
    }

    async function createGatewayReturnDto(): Promise<CreateGatewayDto> {
        const dto = await makeCreateGatewayDto(chirpstackSetupNetworkServerService);
        await service.createNewGateway(dto);
        return dto;
    }
    it("(POST) Create new Gateway", async () => {
        const req: CreateGatewayDto = await makeCreateGatewayDto(
            chirpstackSetupNetworkServerService
        );

        await request(app.getHttpServer())
            .post("/chirpstack/gateway")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(req)
            .expect(201);

        // Check that it was created.
        const newElement = await service.getOne(req.gateway.id);
        expect(newElement).toMatchObject({ gateway: { id: req.gateway.id } });
    });

    it("(GET) Get gateway by id", async () => {
        const id = await createGateway();
        return await request(app.getHttpServer())
            .get(`/chirpstack/gateway/${id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.gateway).toMatchObject({
                    id: id,
                });
                expect(response.body.stats).toHaveLength(30);
            });
    });

    it("(GET) Get gateway by id - bad characters in id", async () => {
        return await request(app.getHttpServer())
            .get(`/chirpstack/gateway/1234567890abcdss`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(400);
    });

    it("(GET) Get gateway by id - bad length", async () => {
        return await request(app.getHttpServer())
            .get(`/chirpstack/gateway/123456`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(400);
    });

    it("(GET) Get all gateways", async () => {
        const id1 = await createGateway();
        const id2 = await createGateway();
        return await request(app.getHttpServer())
            .get(`/chirpstack/gateway`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(+response.body.totalCount).toBeGreaterThanOrEqual(2);
                expect(response.body.result).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            id: id1,
                        }),
                        expect.objectContaining({
                            id: id2,
                        }),
                    ])
                );
            });
    });

    it("(PUT) Change gateway - OK", async () => {
        const dto = await createGatewayReturnDto();
        const originalId = dto.gateway.id;
        dto.gateway.id = undefined;
        dto.organizationId = undefined;
        dto.gateway.tags = undefined;

        dto.gateway.name = `${gatewayNamePrefix}-ChangedName-PUT`;

        await request(app.getHttpServer())
            .put(`/chirpstack/gateway/${originalId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .then(response => {
                Logger.log(response.body);
            });

        // Check that it was changed.
        const changedGateway: SingleGatewayResponseDto = await service.getOne(originalId);
        expect(changedGateway?.gateway).toMatchObject({
            id: originalId,
            name: dto.gateway.name,
        });
    });

    it("(PUT) Change gateway - Bad DTO", async () => {
        const dto = await createGatewayReturnDto();
        const originalId = dto.gateway.id;
        dto.gateway.id = undefined;
        dto.gateway.name = `${gatewayNamePrefix}-ChangedName-PUT`;

        return await request(app.getHttpServer())
            .put(`/chirpstack/gateway/${originalId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send({
                gateway: {
                    id: "blah",
                },
            })
            .expect(400);
    });

    it("(PUT) Change gateway - ID not allowed in update", async () => {
        const dto = await createGatewayReturnDto();
        const originalId = dto.gateway.id;

        await request(app.getHttpServer())
            .put(`/chirpstack/gateway/${originalId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(400)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: "MESSAGE.GATEWAY-ID-NOT-ALLOWED-IN-UPDATE",
                });
            });
    });

    it("(DELETE) Delete gateway", async () => {
        const id = await createGateway();

        return await request(app.getHttpServer())
            .delete(`/chirpstack/gateway/${id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200);
    });
});
