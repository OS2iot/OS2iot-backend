import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { Repository } from "typeorm";

import configuration from "@config/configuration";
import { CreateOrganizationDto } from "@dto/user-management/create-organization.dto";
import { UpdateOrganizationDto } from "@dto/user-management/update-organization.dto";
import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { PermissionType } from "@enum/permission-type.enum";
import { AuthModule } from "@modules/user-management/auth.module";
import { OrganizationModule } from "@modules/user-management/organization.module";

import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateSavedOrganizationAdminUser,
    generateValidJwtForUser,
} from "../test-helpers";
import { AuditLog } from "@services/audit-log.service";
import * as _ from "lodash";

describe("OrganizationController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<Organization>;
    let globalAdminJwt: string;
    let globalAdmin: User;

    let auditLogSuccessListener: any;
    let auditLogFailListener: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ load: [configuration] }),
                OrganizationModule,
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
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("OrganizationRepository");

        auditLogSuccessListener = jest.spyOn(AuditLog, "success");
        auditLogFailListener = jest.spyOn(AuditLog, "fail");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
        // Create user (global admin)
        globalAdmin = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(globalAdmin);
    });

    afterEach(async () => {
        // Clear data after each test
        await clearDatabase();
        jest.clearAllMocks();
    });

    it("(GET) /organization/ - None", () => {
        return request(app.getHttpServer())
            .get("/organization/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toMatchObject([]);
            });
    });

    it("(GET) /organization/ - One", async () => {
        await generateSavedOrganization("E2E");

        return request(app.getHttpServer())
            .get("/organization/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        name: "E2E",
                    },
                ]);
            });
    });

    it("(GET) /organization/ - 100", async () => {
        _.range(100).forEach(
            async x => await generateSavedOrganization("E2E-" + x.toString())
        );

        return request(app.getHttpServer())
            .get("/organization?offset=0&limit=10&orderOn=name&sort=DESC")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(100);
                expect(response.body.data).toHaveLength(10);
            });
    });

    it("(GET) /organization/minimal - 100", async () => {
        _.range(100).forEach(
            async x => await generateSavedOrganization("E2E-" + x.toString())
        );

        return request(app.getHttpServer())
            .get("/organization/minimal")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(100);
                expect(response.body.data).toHaveLength(100);
            });
    });

    it("(GET) /organization/ - Only get allowed orgs", async () => {
        const org = await generateSavedOrganization();
        const orgAdminUser = await generateSavedOrganizationAdminUser(org);
        const orgAdminUserJwt = generateValidJwtForUser(orgAdminUser);

        await generateSavedOrganization("another one");

        return request(app.getHttpServer())
            .get("/organization/")
            .auth(orgAdminUserJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        name: "E2E Test Organization",
                    },
                ]);
            });
    });

    it("(GET) /organization/:id - Get one element by id", async () => {
        const org = await generateSavedOrganization();

        return request(app.getHttpServer())
            .get(`/organization/${org.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: org.id,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    name: org.name,
                });
                expect(response.body.permissions).toContainEqual({
                    id: expect.any(Number),
                    name: `${org.name} - Read`,
                    type: PermissionType.Read,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    automaticallyAddNewApplications: true,
                });
                expect(response.body.permissions).toContainEqual({
                    id: expect.any(Number),
                    name: `${org.name} - Write`,
                    type: PermissionType.Write,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    automaticallyAddNewApplications: true,
                });
                expect(response.body.permissions).toContainEqual({
                    id: expect.any(Number),
                    name: `${org.name} - OrganizationAdmin`,
                    type: PermissionType.OrganizationAdmin,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                });
            });
    });

    it("(GET) /organization/:id - Not found", async () => {
        const org = await generateSavedOrganization();

        return request(app.getHttpServer())
            .get(`/organization/${org.id + 1}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(404)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: `MESSAGE.ID-DOES-NOT-EXIST`,
                });
            });
    });

    it("(POST) /organization/ - Create new Organization", async () => {
        const dto: CreateOrganizationDto = {
            name: "e2e",
        };

        await request(app.getHttpServer())
            .post("/organization/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "e2e",
                });
            });

        const orgFromDb = await repository.findOne({ where: { name: "e2e" } });
        expect(orgFromDb).toBeTruthy();

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(POST) /organization/ - Create organization - fail, not unique name", async () => {
        const org = await generateSavedOrganization();

        const dto: CreateOrganizationDto = {
            name: org.name,
        };

        return await request(app.getHttpServer())
            .post("/organization/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Bad Request",
                    message: ErrorCodes.OrganizationAlreadyExists,
                    statusCode: 400,
                });

                expect(auditLogSuccessListener).not.toHaveBeenCalled();
                expect(auditLogFailListener).toHaveBeenCalled();
            });
    });

    it("(PUT) /organization/:id - Update organization", async () => {
        const org = await generateSavedOrganization();

        const dto: UpdateOrganizationDto = {
            name: `${org.name} - changed`,
        };

        return await request(app.getHttpServer())
            .put(`/organization/${org.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: `${org.name} - changed`,
                });

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });

    it("(PUT) /organization/:id - Update organization - fail", async () => {
        const org = await generateSavedOrganization();

        const dto: UpdateOrganizationDto = {
            name: `${org.name} - changed`,
        };

        return await request(app.getHttpServer())
            .put(`/organization/${org.id + 1}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(404)
            .expect("Content-Type", /json/);
    });

    it("(DELETE) /organization/:id - delete", async () => {
        const org = await generateSavedOrganization();

        await request(app.getHttpServer())
            .delete(`/organization/${org.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    affected: 1,
                });
            });

        const orgs = await repository.find();
        expect(orgs).toHaveLength(0);

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(DELETE) /organization/:id - delete - fail", async () => {
        const org = await generateSavedOrganization();

        await request(app.getHttpServer())
            .delete(`/organization/${org.id + 1}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(404)
            .expect("Content-Type", /json/);
    });
});
