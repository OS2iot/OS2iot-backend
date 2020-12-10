import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { NoOpLogger } from "../no-op-logger";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { getManager } from "typeorm";

import configuration from "@config/configuration";
import { CreatePermissionDto } from "@dto/user-management/create-permission.dto";
import { UpdatePermissionDto } from "@dto/user-management/update-permission.dto";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { User } from "@entities/user.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { AuthModule } from "@modules/user-management/auth.module";
import { PermissionModule } from "@modules/user-management/permission.module";

import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateSavedOrganizationAdminUser,
    generateValidJwtForUser,
} from "../test-helpers";
import { AuditLog } from "@services/audit-log.service";

describe("PermissionController (e2e)", () => {
    let app: INestApplication;
    let globalAdminJwt: string;
    let globalAdmin: User;

    let auditLogSuccessListener: any;
    let auditLogFailListener: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ load: [configuration] }),
                PermissionModule,
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
        moduleFixture.useLogger(new NoOpLogger());

        app = moduleFixture.createNestApplication();
        await app.init();

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

    it("(GET) /permission/ - Only Global Admin", async () => {
        return request(app.getHttpServer())
            .get("/permission/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        type: PermissionType.GlobalAdmin,
                    },
                ]);
            });
    });

    it("(GET) /permission/ - GlobalAdmin and Organization", async () => {
        const org = await generateSavedOrganization("E2E");

        return await request(app.getHttpServer())
            .get("/permission/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(4);
                expect(response.body.data).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            name: "GlobalAdmin",
                            type: PermissionType.GlobalAdmin,
                        }),
                        expect.objectContaining({
                            name: org.name + " - OrganizationAdmin",
                            type: PermissionType.OrganizationAdmin,
                        }),
                        expect.objectContaining({
                            name: org.name + " - Write",
                            type: PermissionType.Write,
                            automaticallyAddNewApplications: true,
                        }),
                        expect.objectContaining({
                            name: org.name + " - Read",
                            type: PermissionType.Read,
                            automaticallyAddNewApplications: true,
                        }),
                    ])
                );
            });
    });

    it("(GET) /permission/:id - GlobalAdmin", async () => {
        return await request(app.getHttpServer())
            .get("/permission/" + globalAdmin.permissions[0].id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "GlobalAdmin",
                    type: PermissionType.GlobalAdmin,
                    users: [
                        {
                            id: globalAdmin.id,
                        },
                    ],
                });
            });
    });

    it("(POST) /permission/ - Create new permission", async () => {
        const org = await generateSavedOrganization("E2E");

        const dto: CreatePermissionDto = {
            level: PermissionType.Read,
            name: "E2E readers",
            organizationId: org.id,
            userIds: [],
            applicationIds: [],
        };

        return await request(app.getHttpServer())
            .post("/permission/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: dto.name,
                    organization: {
                        id: org.id,
                    },
                    automaticallyAddNewApplications: false,
                });

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });

    it("(PUT) /permission/:id - Change a permission", async () => {
        const org = await generateSavedOrganization("E2E");
        const userToAdd = await generateSavedOrganizationAdminUser(org);

        const permissionToChange = org.permissions.find(
            x => x.constructor.name == "ReadPermission"
        );

        const dto: UpdatePermissionDto = {
            name: "E2E readers - changed",
            userIds: [userToAdd.id],
            applicationIds: (permissionToChange as OrganizationApplicationPermission)?.applications?.map(
                x => x.id
            ),
        };

        await request(app.getHttpServer())
            .put("/permission/" + permissionToChange.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: dto.name,
                    organization: {
                        id: org.id,
                    },
                });
            });

        const changedPermission = await getManager().findOne(
            ReadPermission,
            permissionToChange.id,
            {
                relations: ["users"],
            }
        );
        expect(changedPermission.name).toBe(dto.name);
        expect(changedPermission.users).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: userToAdd.id,
                }),
            ])
        );

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(PUT) /permission/:id - Org admin - change permission", async () => {
        const org = await generateSavedOrganization("E2E");
        const userToAdd = await generateSavedOrganizationAdminUser(org);
        const orgAdminUser = await generateSavedOrganizationAdminUser(org);
        const jwt = generateValidJwtForUser(orgAdminUser);

        const permissionToChange = org.permissions.find(
            x => x.constructor.name == "ReadPermission"
        );

        const dto: UpdatePermissionDto = {
            name: "E2E readers - changed",
            userIds: [userToAdd.id],
            applicationIds: (permissionToChange as OrganizationApplicationPermission)?.applications?.map(
                x => x.id
            ),
        };

        await request(app.getHttpServer())
            .put("/permission/" + permissionToChange.id)
            .auth(jwt, { type: "bearer" })
            .send(dto)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: dto.name,
                    organization: {
                        id: org.id,
                    },
                });
            });

        const changedPermission = await getManager().findOne(
            ReadPermission,
            permissionToChange.id,
            {
                relations: ["users"],
            }
        );
        expect(changedPermission.name).toBe(dto.name);
        expect(changedPermission.users).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: userToAdd.id,
                }),
            ])
        );

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(DELETE) /permission/:id - Org admin - Delete a permission", async () => {
        const org = await generateSavedOrganization("E2E");
        const orgAdminUser = await generateSavedOrganizationAdminUser(org);
        const jwt = generateValidJwtForUser(orgAdminUser);

        const permissionToDelete = org.permissions.find(
            x => x.constructor.name == "ReadPermission"
        );

        return await request(app.getHttpServer())
            .delete("/permission/" + permissionToDelete.id)
            .auth(jwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    affected: 1,
                });

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });

    it("(DELETE) /permission/:id - Org admin - Delete a permission, not allowed", async () => {
        const org = await generateSavedOrganization("E2E");
        const org2 = await generateSavedOrganization("E2E-2");
        const orgAdminUser = await generateSavedOrganizationAdminUser(org2);
        const jwt = generateValidJwtForUser(orgAdminUser);

        const permissionToDelete = org.permissions.find(
            x => x.constructor.name == "ReadPermission"
        );

        await request(app.getHttpServer())
            .delete("/permission/" + permissionToDelete.id)
            .auth(jwt, { type: "bearer" })
            .expect(403);

        expect(auditLogSuccessListener).not.toHaveBeenCalled();
        expect(auditLogFailListener).toHaveBeenCalled();
    });

    it("(DELETE) /permission/:id - Delete a permission", async () => {
        const org = await generateSavedOrganization("E2E");

        const permissionToDelete = org.permissions.find(
            x => x.constructor.name == "ReadPermission"
        );

        return await request(app.getHttpServer())
            .delete("/permission/" + permissionToDelete.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    affected: 1,
                });

                expect(auditLogSuccessListener).toHaveBeenCalled();
                expect(auditLogFailListener).not.toHaveBeenCalled();
            });
    });
});
