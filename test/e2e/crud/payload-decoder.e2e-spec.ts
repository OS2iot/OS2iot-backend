import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { Repository } from "typeorm";

import configuration from "@config/configuration";
import { CreatePayloadDecoderDto } from "@dto/create-payload-decoder.dto";
import { UpdatePayloadDecoderDto } from "@dto/update-payload-decoder.dto";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PayloadDecoderModule } from "@modules/device-management/payload-decoder.module";
import { AuthModule } from "@modules/user-management/auth.module";

import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateSavedPayloadDecoder,
    generateValidJwtForUser,
} from "../test-helpers";

describe("PayloadDecoderController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<PayloadDecoder>;
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
                PayloadDecoderModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("PayloadDecoderRepository");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
        // Create user (global admin)
        const user = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(user);
    });

    afterEach(async () => {
        // Clear data after each test
        await clearDatabase();
    });

    it("(GET) /payload-decoder/ - empty", () => {
        return request(app.getHttpServer())
            .get("/payload-decoder/")
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toStrictEqual([]);
            });
    });

    it("(GET) /payload-decoder/ - 1 result", async () => {
        await generateSavedPayloadDecoder();

        return await request(app.getHttpServer())
            .get("/payload-decoder/")
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        name: "E2E Test Payload Decoder",
                    },
                ]);
            });
    });

    it("(GET) /payload-decoder/:id - found", async () => {
        const decoder = await generateSavedPayloadDecoder();

        return await request(app.getHttpServer())
            .get(`/payload-decoder/${decoder.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: decoder.name,
                    decodingFunction: decoder.decodingFunction,
                });
            });
    });

    it("(GET) /payload-decoder/:id - not found", async () => {
        const decoder = await generateSavedPayloadDecoder();
        const wrongId = decoder.id + 1;

        return await request(app.getHttpServer())
            .get(`/payload-decoder/${wrongId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(404)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Not Found",
                });
            });
    });

    it("(POST) /payload-decoder/ - create new data target", async () => {
        const organization = await generateSavedOrganization();

        const body: CreatePayloadDecoderDto = {
            name: "Test",
            decodingFunction: JSON.stringify("return 1;"),
            organizationId: organization.id,
        };

        await request(app.getHttpServer())
            .post(`/payload-decoder/`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(body)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "Test",
                    decodingFunction: "return 1;",
                });
            });

        const payloadDecodersInDb = await repository.find();
        expect(payloadDecodersInDb).toHaveLength(1);
        expect(payloadDecodersInDb[0]).toMatchObject({
            name: "Test",
        });
    });

    it("(POST) /payload-decoder/ - decoding function not encoded", async () => {
        const body: any = {
            name: "Test",
            decodingFunction: "not escaped at all ... ",
        };

        return await request(app.getHttpServer())
            .post(`/payload-decoder/`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(body)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: `MESSAGE.BAD-ENCODING`,
                });
            });
    });

    it("(PUT) /payload-decoder/:id - change existing", async () => {
        const organization = await generateSavedOrganization();
        const decoder = await generateSavedPayloadDecoder();
        const body: UpdatePayloadDecoderDto = {
            name: decoder.name,
            decodingFunction: JSON.stringify("return 0;"),
            organizationId: organization.id,
        };

        return await request(app.getHttpServer())
            .put(`/payload-decoder/${decoder.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(body)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: decoder.name,
                    decodingFunction: "return 0;",
                });
            });
    });

    it("(DELETE) /payload-decoder/:id - not found", async () => {
        const decoder = await generateSavedPayloadDecoder();
        const wrongId = decoder.id + 1;

        return await request(app.getHttpServer())
            .delete(`/payload-decoder/${wrongId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(404)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "EntityNotFound",
                });
            });
    });

    it("(DELETE) /payload-decoder/:id - deleted", async () => {
        const decoder = await generateSavedPayloadDecoder();

        return await request(app.getHttpServer())
            .delete(`/payload-decoder/${decoder.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    affected: 1,
                });
            });
    });
});
