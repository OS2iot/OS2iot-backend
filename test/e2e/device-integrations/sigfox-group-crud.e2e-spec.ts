import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { getManager, Repository } from "typeorm";

import configuration from "@config/configuration";
import { AuthModule } from "@modules/user-management/auth.module";

import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateSavedSigFoxGroup,
    generateSigFoxGroup,
    generateValidJwtForUser,
} from "../test-helpers";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { SigFoxGroupModule } from "@modules/device-integrations/sigfox-group.module";
import { Organization } from "@entities/organization.entity";
import { CreateSigFoxGroupRequestDto } from "@dto/sigfox/internal/create-sigfox-group-request.dto";
import { UpdateSigFoxGroupRequestDto } from "@dto/sigfox/internal/update-sigfox-group-request.dto";
import { User } from "@entities/user.entity";
import { AuditLog } from "@services/audit-log.service";

describe("SigfoxGroupController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<SigFoxGroup>;
    let globalAdminJwt: string;
    let globalAdmin: User;
    let org: Organization;

    let auditLogSuccessListener: any;
    let auditLogFailListener: any;

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
                SigFoxGroupModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("GenericHTTPDeviceRepository");

        auditLogSuccessListener = jest.spyOn(AuditLog, "success");
        auditLogFailListener = jest.spyOn(AuditLog, "fail");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        await clearDatabase();
        // Create user (global admin)
        globalAdmin = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(globalAdmin);

        org = await generateSavedOrganization("E2E-test");
    });

    afterEach(async () => {
        await clearDatabase();
        jest.clearAllMocks();
    });

    it("(GET) /sigfox-group/ - empty", async () => {
        // Arrange
        // ...

        // Act
        return await request(app.getHttpServer())
            .get(`/sigfox-group?organizationId=${org.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    data: [],
                    count: 0,
                });
            });
    });
    it("(GET) /sigfox-group/ - empty", async () => {
        // Arrange
        const sigfoxGroup = await generateSavedSigFoxGroup(org);

        // Act
        return await request(app.getHttpServer())
            .get(`/sigfox-group?organizationId=${org.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    data: [
                        {
                            username: "5f2d1069e833d903621ff237",
                            belongsTo: {
                                id: org.id,
                            },
                            sigfoxGroupData: {
                                id: "5e74c24476600f14bab7e0bd",
                                name: "Aarhus kommune",
                            },
                        },
                    ],
                    count: 1,
                });
            });
    });

    it("(GET) /sigfox-group/:id - one result", async () => {
        // Arrange
        const sigfoxGroup = await generateSavedSigFoxGroup(org);

        // Act
        return await request(app.getHttpServer())
            .get(`/sigfox-group/${sigfoxGroup.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    username: "5f2d1069e833d903621ff237",
                    belongsTo: {
                        id: org.id,
                    },
                    sigfoxGroupData: {
                        id: "5e74c24476600f14bab7e0bd",
                        name: "Aarhus kommune",
                    },
                });
                expect(response.body).not.toHaveProperty("password");
            });
    });

    it("(GET) /sigfox-group/:id - Not found", async () => {
        // Arrange
        const sigfoxGroup = await generateSavedSigFoxGroup(org);

        // Act
        return await request(app.getHttpServer())
            .get(`/sigfox-group/${sigfoxGroup.id + 1}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            // Assert
            .expect(404)
            .expect("Content-Type", /json/);
    });

    it("(POST) /sigfox-group/ - create one", async () => {
        // Arrange
        const validdata = generateSigFoxGroup(org);
        const dto: CreateSigFoxGroupRequestDto = {
            username: validdata.username,
            password: validdata.password,
            organizationId: org.id,
        };

        // Act
        return await request(app.getHttpServer())
            .post(`/sigfox-group/`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    username: "5f2d1069e833d903621ff237",
                    belongsTo: {
                        id: org.id,
                    },
                    sigfoxGroupData: {
                        id: "5e74c24476600f14bab7e0bd",
                        name: "Aarhus kommune",
                    },
                });
                expect(response.body).not.toHaveProperty("password");

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });

    it("(POST) /sigfox-group/ - create one with wrong password", async () => {
        // Arrange
        const validdata = generateSigFoxGroup(org);
        const dto: CreateSigFoxGroupRequestDto = {
            username: validdata.username,
            password: validdata.password + "blablanotgood",
            organizationId: org.id,
        };

        // Act
        return await request(app.getHttpServer())
            .post(`/sigfox-group/`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(401)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: "MESSAGE.SIGFOX-BAD-LOGIN",
                    statusCode: 401,
                });
                expect(response.body).not.toHaveProperty("password");

                expect(auditLogSuccessListener).not.toHaveBeenCalled();
                expect(auditLogFailListener).toHaveBeenCalled();
            });
    });

    it("(PUT) /sigfox-group/ - Change one - now right password", async () => {
        // Arrange
        const group = generateSigFoxGroup(org);
        const originalPassword = group.password;
        group.password = "not-right";
        const savedGroup = await getManager().save(group);
        const dto: UpdateSigFoxGroupRequestDto = {
            username: savedGroup.username,
            password: originalPassword,
        };

        // Act
        return await request(app.getHttpServer())
            .put(`/sigfox-group/${savedGroup.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    username: "5f2d1069e833d903621ff237",
                    belongsTo: {
                        id: org.id,
                    },
                    sigfoxGroupData: {
                        id: "5e74c24476600f14bab7e0bd",
                        name: "Aarhus kommune",
                    },
                });
                expect(response.body).not.toHaveProperty("password");

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });

    it("(PUT) /sigfox-group/ - Change one - now wrong password", async () => {
        // Arrange
        const group = await generateSavedSigFoxGroup(org);
        const dto: UpdateSigFoxGroupRequestDto = {
            username: group.username,
            password: group.password + "wrong",
        };

        // Act
        return await request(app.getHttpServer())
            .put(`/sigfox-group/${group.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(401)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: "MESSAGE.SIGFOX-BAD-LOGIN",
                    statusCode: 401,
                });

                expect(auditLogSuccessListener).not.toHaveBeenCalled();
                expect(auditLogFailListener).toHaveBeenCalled();
            });
    });

    it("(PUT) /sigfox-group/ - Not found", async () => {
        // Arrange
        const group = await generateSavedSigFoxGroup(org);
        const dto: UpdateSigFoxGroupRequestDto = {
            username: "something",
            password: "wrong",
        };

        // Act
        await request(app.getHttpServer())
            .put(`/sigfox-group/${group.id + 1}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(404)
            .expect("Content-Type", /json/);

        expect(auditLogSuccessListener).not.toHaveBeenCalled();
        expect(auditLogFailListener).toHaveBeenCalled();
    });

    it("(POST) /sigfox-group/test-connection - OK", async () => {
        // Arrange
        const group = generateSigFoxGroup(org);
        const dto = {
            username: group.username,
            password: group.password,
        };
        // Act
        return await request(app.getHttpServer())
            .post(`/sigfox-group/test-connection`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.status).toBeTruthy();
            });
    });

    it("(POST) /sigfox-group/test-connection - Not ok", async () => {
        // Arrange
        const dto = {
            username: "wrong",
            password: "bad",
        };
        // Act
        return await request(app.getHttpServer())
            .post(`/sigfox-group/test-connection`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.status).not.toBeTruthy();
            });
    });
});
