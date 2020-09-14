import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateValidJwtForUser,
} from "../test-helpers";
import { User } from "@entities/user.entity";
import { AuthModule } from "@modules/auth.module";
import { Permission } from "@entities/permission.entity";
import { PermissionModule } from "@modules/permission.module";
import * as request from "supertest";
import { PermissionType } from "@enum/permission-type.enum";

describe("PermissionController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<Permission>;
    let globalAdminJwt: string;
    let user: User;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
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

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("OrganizationRepository");
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

});
