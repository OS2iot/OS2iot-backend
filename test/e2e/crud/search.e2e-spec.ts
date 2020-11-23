import { INestApplication, Logger } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { getManager } from "typeorm";

import configuration from "@config/configuration";
import { PermissionType } from "@enum/permission-type.enum";
import { AuthModule } from "@modules/user-management/auth.module";

import {
    clearDatabase,
    gatewayNamePrefix,
    generateSavedApplication,
    generateSavedGlobalAdminUser,
    generateSavedHttpDevice,
    generateSavedLoRaWANDevice,
    generateSavedOrganization,
    generateSavedOrganizationAdminUser,
    generateSavedReadWriteUser,
    generateSavedSigfoxDevice,
    generateValidJwtForUser,
    makeCreateGatewayDto,
} from "../test-helpers";
import { SearchModule } from "@modules/search.module";
import { Organization } from "@entities/organization.entity";
import { Application } from "@entities/application.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { CreateGatewayDto } from "@dto/chirpstack/create-gateway.dto";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { User } from "@entities/user.entity";

describe("SearchController (e2e)", () => {
    let app: INestApplication;
    let globalAdmin: User;
    let globalAdminJwt: string;
    let orgAdminJwt: string;
    let readUserJwt: string;
    let org1: Organization;
    let org2: Organization;
    let app1_1: Application;
    let app1_2: Application;
    let app2_1: Application;
    let app2_2: Application;
    let soeren: Application;
    let device1_1_1: GenericHTTPDevice;
    let device2_1_1: GenericHTTPDevice;
    let lora1_1_1: LoRaWANDevice;
    let lora2_1_1: LoRaWANDevice;
    let sigfox1_1_1: SigFoxDevice;
    let sigfox2_1_1: SigFoxDevice;
    let chirpstackGatewayService: ChirpstackGatewayService;
    let chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService;
    let gatewayRequest: CreateGatewayDto;

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
                SearchModule,
                ChirpstackAdministrationModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        chirpstackGatewayService = moduleFixture.get(ChirpstackGatewayService.name);
        chirpstackSetupNetworkServerService = moduleFixture.get(
            "ChirpstackSetupNetworkServerService"
        );

        // Clear data before each test
        await clearDatabase();

        // Delete all gateways created in E2E tests:
        const existing = await chirpstackGatewayService.listAllPaginated(1000, 0);
        existing.result.forEach(async element => {
            if (element.name.startsWith(gatewayNamePrefix)) {
                Logger.debug(`Found ${element.name}, deleting.`);
                await chirpstackGatewayService.deleteGateway(element.id);
            }
        });

        // Create user (global admin)
        globalAdmin = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(globalAdmin);

        gatewayRequest = await makeCreateGatewayDto(chirpstackSetupNetworkServerService);
        await chirpstackGatewayService.createNewGateway(gatewayRequest, globalAdmin.id);

        // Add set of data
        org1 = await generateSavedOrganization("org1");
        org2 = await generateSavedOrganization("org2");
        app1_1 = await generateSavedApplication(org1, "app1_1");
        app1_2 = await generateSavedApplication(org1, "app1_2");
        app2_1 = await generateSavedApplication(org2, "app2_1");
        app2_2 = await generateSavedApplication(org2, "app2_2");
        device1_1_1 = await generateSavedHttpDevice(app1_1, "1");
        device2_1_1 = await generateSavedHttpDevice(app2_1, "2");
        lora1_1_1 = await generateSavedLoRaWANDevice(app1_1, "1");
        lora2_1_1 = await generateSavedLoRaWANDevice(app2_1, "2");
        sigfox1_1_1 = await generateSavedSigfoxDevice(app1_1, "1");
        sigfox2_1_1 = await generateSavedSigfoxDevice(app2_1, "2");
        soeren = await generateSavedApplication(org2, "Søren");

        const orgAdminUser = await generateSavedOrganizationAdminUser(org1);
        orgAdminJwt = generateValidJwtForUser(orgAdminUser);

        const writePerm = org1.permissions.find(
            x => x.type == PermissionType.Write
        ) as WritePermission;
        writePerm.applications = [app1_1];
        await getManager().save(writePerm);

        const readUser = await generateSavedReadWriteUser(org1);
        readUserJwt = generateValidJwtForUser(readUser);
    });

    afterAll(async () => {
        // Clear data after each test
        await clearDatabase();
        // Ensure clean shutdown
        await app.close();
    });

    it("(GET) /search?limit=10&offset=0&q= - query missing", async () => {
        return request(app.getHttpServer())
            .get("/search?limit=10&offset=0&q=")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: "MESSAGE.QUERY-MUST-NOT-BE-EMPTY",
                });
            });
    });

    it("(GET) /search?limit=10&offset=0&q=E2E - Global Admin", async () => {
        return request(app.getHttpServer())
            .get("/search?limit=10&offset=0&q=E2E")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(12);
            });
    });

    it("(GET) /search?limit=10&offset=0&q=E2E - 'Søren'", async () => {
        return request(app.getHttpServer())
            .get("/search?limit=10&offset=0&q=Søren")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
            });
    });

    it("(GET) /search?limit=10&offset=0&q=E2E - Org Admin", async () => {
        return request(app.getHttpServer())
            .get("/search?limit=10&offset=0&q=E2E")
            .auth(orgAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(6);
            });
    });

    it("(GET) /search?limit=10&offset=0&q=E2E - Read/Write", async () => {
        return request(app.getHttpServer())
            .get("/search?limit=10&offset=0&q=E2E")
            .auth(readUserJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(5);
            });
    });

    it("(GET) /search?limit=10&offset=0&q=:lorawanId - Read/Write", async () => {
        return request(app.getHttpServer())
            .get(`/search?limit=10&offset=0&q=${lora1_1_1.deviceEUI}`)
            .auth(readUserJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
            });
    });

    it("(GET) /search?limit=10&offset=0&q=:sigfox - Read/Write", async () => {
        return request(app.getHttpServer())
            .get(`/search?limit=10&offset=0&q=${sigfox1_1_1.deviceId}`)
            .auth(readUserJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
            });
    });

    it("(GET) /search?limit=10&offset=0&q=:generic - Read/Write", async () => {
        return request(app.getHttpServer())
            .get(`/search?limit=10&offset=0&q=${device1_1_1.apiKey}`)
            .auth(readUserJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
            });
    });

    it("(GET) /search?limit=10&offset=0&q=:gateway - Read/Write", async () => {
        return request(app.getHttpServer())
            .get(`/search?limit=10&offset=0&q=${gatewayRequest.gateway.id}`)
            .auth(readUserJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
            });
    });
});
