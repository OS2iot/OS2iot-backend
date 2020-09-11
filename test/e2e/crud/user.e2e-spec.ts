import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateValidJwtForUser,
} from "../test-helpers";
import { UserModule } from "@modules/user.module";
import { User } from "@entities/user.entity";
import { AuthModule } from "../../../src/modules/auth.module";
import * as bcrypt from "bcryptjs";

describe("UserController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<User>;
    let globalAdminJwt: string;
    let user: User;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                UserModule,
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
        repository = moduleFixture.get("UserRepository");
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
                        email: "test@test.test",
                    },
                ]);
                // Ensure that passwords / passwordHashes are not leaked.
                expect(response.body.data[0]).not.toHaveProperty("password");
                expect(response.body.data[0]).not.toHaveProperty(
                    "passwordHash"
                );
            });
    });

    it("(GET) /user/:id - Get one element by id", async () => {
        return request(app.getHttpServer())
            .get(`/user/${user.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: user.id,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    name: user.name,
                    email: user.email,
                    active: user.active,
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
            .get(`/user/${user.id + 1}`)
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
        const isPasswordCorrect = await bcrypt.compare(
            dto.password,
            user.passwordHash
        );
        expect(isPasswordCorrect).toBeTruthy();
    });
    it("(POST) /user/ - Create user - fail, not unique email", async () => {
        const dto = {
            name: "test",
            email: user.email,
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
            });
    });

    it("(PUT) /user/:id - Update user", async () => {
        // TODO: This
        return true;
    });

    it("(DELETE) /user/:id - Delete user", async () => {
        // TODO: This
        return true;
    });
});
