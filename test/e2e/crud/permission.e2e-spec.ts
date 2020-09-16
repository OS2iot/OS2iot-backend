import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { getManager } from "typeorm";
import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateValidJwtForUser,
    generateSavedOrganization,
    generateSavedOrganizationAdminUser,
} from "../test-helpers";
import { User } from "@entities/user.entity";
import { AuthModule } from "@modules/auth.module";
import { PermissionModule } from "@modules/permission.module";
import * as request from "supertest";
import { PermissionType } from "@enum/permission-type.enum";
import { CreatePermissionDto } from "@dto/user-management/create-permission.dto";
import { UpdatePermissionDto } from "@dto/user-management/update-permission.dto";
import { ReadPermission } from "@entities/read-permission.entity";
import { ConfigModule } from "@nestjs/config";
import configuration from "@config/configuration";

describe("PermissionController (e2e)", () => {
    let app: INestApplication;
    let globalAdminJwt: string;
    let user: User;

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

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
        // Create user (global admin)
        user = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(user);
    });

    afterEach(async () => {
        // Clear data after each test
        await clearDatabase();
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
                        }),
                        expect.objectContaining({
                            name: org.name + " - Read",
                            type: PermissionType.Read,
                        }),
                    ])
                );
            });
    });

    it("(GET) /permission/:id - GlobalAdmin", async () => {
        return await request(app.getHttpServer())
            .get("/permission/" + user.permissions[0].id)
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
                            id: user.id,
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
                });
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
            });
    });
});
