import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AuthModule } from "@modules/auth.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { jwtConstants } from "@auth/constants";
import { generateSavedGlobalAdminUser, clearDatabase } from "./test-helpers";
import { LoginDto } from "@dto/login.dto";
import { TypeOrmModule } from "@nestjs/typeorm";

describe("AuthController (e2e)", () => {
    let app: INestApplication;
    let jwtService: JwtService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                AuthModule,
                PassportModule.register({ defaultStrategy: "jwt" }),
                JwtModule.register({
                    secret: jwtConstants.secret,
                    signOptions: { expiresIn: "9h" }, // TODO: Make this configurable?
                }),
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
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        jwtService = moduleFixture.get("JwtService");
    });

    beforeEach(async () => {
        await clearDatabase();
    });

    afterEach(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    it("(POST) /login/ - Global Admin", async () => {
        // Arrange
        const globalAdmin = await generateSavedGlobalAdminUser();
        const loginDto: LoginDto = {
            username: globalAdmin.email,
            password: "hunter2",
        };

        // Act
        return await request(app.getHttpServer())
            .post("/auth/login")
            .send(loginDto)
            // Assert
            .expect(201)
            .then(response => {
                expect(response.body).toMatchObject({
                    accessToken: expect.any(String),
                });

                const decoded = jwtService.decode(response.body.accessToken);
                const str = JSON.stringify(decoded);
                const obj = JSON.parse(str);

                expect(obj.sub).toBe(globalAdmin.id);
                expect(obj.username).toBe(globalAdmin.email);
                expect(obj.iat).toStrictEqual(expect.any(Number));
                expect(obj.exp).toStrictEqual(expect.any(Number));
            });
    });

    it("(POST) /login/ - wrong username", async () => {
        // Arrange
        const globalAdmin = await generateSavedGlobalAdminUser();
        const loginDto: LoginDto = {
            username: `${globalAdmin.email}asdf`,
            password: "hunter2",
        };

        // Act
        return await request(app.getHttpServer())
            .post("/auth/login")
            .send(loginDto)
            // Assert
            .expect(401)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: "Unauthorized",
                    statusCode: 401,
                });
            });
    });

    it("(POST) /login/ - wrong password", async () => {
        // Arrange
        const globalAdmin = await generateSavedGlobalAdminUser();
        const loginDto: LoginDto = {
            username: `${globalAdmin.email}`,
            password: "hunter2345",
        };

        // Act
        return await request(app.getHttpServer())
            .post("/auth/login")
            .send(loginDto)
            // Assert
            .expect(401)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: "Unauthorized",
                    statusCode: 401,
                });
            });
    });

    it("(GET) /profile/ - Call protected endpoint without login or JWT", async () => {
        return await request(app.getHttpServer())
            .get("/auth/profile")
            .expect(401)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: "Unauthorized",
                    statusCode: 401,
                });
            });
    });

    it("(GET) /profile/ - Call protected endpoint with bad JWT", async () => {
        const someInvalidJwt =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        return await request(app.getHttpServer())
            .get("/auth/profile")
            .auth(someInvalidJwt, { type: "bearer" })
            .expect(401)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: "Unauthorized",
                    statusCode: 401,
                });
            });
    });

    it("(GET) /profile/ - Login and use JWT", async () => {
        // Arrange
        const globalAdmin = await generateSavedGlobalAdminUser();
        const loginDto: LoginDto = {
            username: globalAdmin.email,
            password: "hunter2",
        };

        // Act - login
        let jwt = "";
        await request(app.getHttpServer())
            .post("/auth/login")
            .send(loginDto)
            // Assert
            .expect(201)
            .then(response => {
                expect(response.body).toMatchObject({
                    accessToken: expect.any(String),
                });

                jwt = response.body.accessToken;
            });

        return await request(app.getHttpServer())
            .get("/auth/profile")
            .auth(jwt, { type: "bearer" })
            .expect(200)
            .then(response => {
                expect(response.body).toMatchObject({
                    sub: globalAdmin.id,
                    username: globalAdmin.email,
                });
            });
    });
});
