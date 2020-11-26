import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import * as request from "supertest";
import { Repository } from "typeorm";

import configuration from "@config/configuration";
import { UpdateUserDto } from "@dto/user-management/update-user.dto";
import { User } from "@entities/user.entity";
import { AuthModule } from "@modules/user-management/auth.module";
import { UserModule } from "@modules/user-management/user.module";

import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateSavedOrganizationAdminUser,
    generateValidJwtForUser,
} from "../test-helpers";
import { AuditLog } from "@services/audit-log.service";

describe("UserController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<User>;
    let globalAdminJwt: string;
    let globalAdmin: User;

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
                UserModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("UserRepository");

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

    it("(GET) /user/ - Only Global Admin", () => {
        return request(app.getHttpServer())
            .get("/user/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        email: globalAdmin.email,
                    },
                ]);
                // Ensure that passwords / passwordHashes are not leaked.
                expect(response.body.data[0]).not.toHaveProperty("password");
                expect(response.body.data[0]).not.toHaveProperty("passwordHash");
            });
    });

    it("(GET) /user/:id - Get one element by id", async () => {
        return request(app.getHttpServer())
            .get(`/user/${globalAdmin.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: globalAdmin.id,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    name: globalAdmin.name,
                    email: globalAdmin.email,
                    active: globalAdmin.active,
                    permissions: [
                        {
                            name: "GlobalAdmin",
                            type: "GlobalAdmin",
                            createdAt: expect.any(String),
                            updatedAt: expect.any(String),
                        },
                    ],
                });
                // Ensure that passwords / passwordHashes are not leaked.
                expect(response.body).not.toHaveProperty("password");
                expect(response.body).not.toHaveProperty("passwordHash");
            });
    });

    it("(GET) /user/:id - Not found", async () => {
        return request(app.getHttpServer())
            .get(`/user/${globalAdmin.id + 1}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(404)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: `MESSAGE.ID-DOES-NOT-EXIST`,
                });
            });
    });

    it("(POST) /user/ - Create user", async () => {
        const dto = {
            name: "test",
            email: "e2e@test.dk",
            password: "string",
            active: true,
        };

        let userId;
        await request(app.getHttpServer())
            .post("/user/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                userId = response.body.id;
                expect(response.body).toMatchObject({
                    name: "test",
                    email: "e2e@test.dk",
                    active: true,
                });
            });

        const usersInDb: User[] = await repository.find();
        expect(usersInDb).toHaveLength(2);
        const user = await repository.findOne(userId, {
            select: ["passwordHash"],
        });
        const isPasswordCorrect = await bcrypt.compare(dto.password, user.passwordHash);
        expect(isPasswordCorrect).toBeTruthy();

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });
    it("(POST) /user/ - Create user - fail, not unique email", async () => {
        const dto = {
            name: "test",
            email: globalAdmin.email,
            password: "string",
            active: true,
        };

        return await request(app.getHttpServer())
            .post("/user/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Bad Request",
                    message: "MESSAGE.USER-ALREADY-EXISTS",
                    statusCode: 400,
                });
                expect(auditLogSuccessListener).not.toHaveBeenCalled();
                expect(auditLogFailListener).toHaveBeenCalled();
            });
    });

    it("(PUT) /user/:id - Update user", async () => {
        const dto: UpdateUserDto = {
            name: `${globalAdmin.name} - changed`,
            email: globalAdmin.email,
            password: "nothunter2",
            active: true,
        };

        await request(app.getHttpServer())
            .put(`/user/${globalAdmin.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: `${globalAdmin.name} - changed`,
                    email: globalAdmin.email,
                    active: true,
                });
            });

        const usersInDb: User[] = await repository.find();
        expect(usersInDb).toHaveLength(1);
        const userFromDb = await repository.findOne(globalAdmin.id, {
            select: ["passwordHash"],
        });
        const isPasswordCorrect = await bcrypt.compare(
            dto.password,
            userFromDb.passwordHash
        );
        expect(isPasswordCorrect).toBeTruthy();

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(PUT) /user/:id - Update user - password optional", async () => {
        const dto: UpdateUserDto = {
            name: `${globalAdmin.name} - changed2`,
            email: globalAdmin.email,
            active: true,
        };

        await request(app.getHttpServer())
            .put(`/user/${globalAdmin.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: `${globalAdmin.name} - changed2`,
                    email: globalAdmin.email,
                    active: true,
                });
            });

        const usersInDb: User[] = await repository.find();
        expect(usersInDb).toHaveLength(1);
        const userFromDb = await repository.findOne(globalAdmin.id, {
            select: ["passwordHash"],
        });
        const isPasswordCorrect = await bcrypt.compare(
            "hunter2",
            userFromDb.passwordHash
        );
        expect(isPasswordCorrect).toBeTruthy();

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(PUT) /user/:id - Update user - Preserves permissions", async () => {
        const org = await generateSavedOrganization();
        const orgUser = await generateSavedOrganizationAdminUser(org);
        const before = await repository.findOne(orgUser.id, {
            relations: ["permissions"],
        });
        expect(before.permissions).toHaveLength(1);

        const dto: UpdateUserDto = {
            name: `${orgUser.name} - changed2`,
            email: orgUser.email,
            active: true,
            globalAdmin: false,
        };

        await request(app.getHttpServer())
            .put(`/user/${orgUser.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: `${orgUser.name} - changed2`,
                    email: orgUser.email,
                    active: true,
                });
            });

        const usersInDb: User[] = await repository.find();
        expect(usersInDb).toHaveLength(2);
        const userFromDb = await repository.findOne(orgUser.id, {
            relations: ["permissions"],
        });
        expect(userFromDb.permissions).toHaveLength(1);
        expect(userFromDb.permissions[0]).toMatchObject({
            type: "OrganizationAdmin",
        });

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });
});
