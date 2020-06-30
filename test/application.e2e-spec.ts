import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, Body } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationModule } from "../src/application/application.module";
import { Repository, getConnection } from "typeorm";
import { Application } from "../src/entity/applikation.entity";

describe("ApplicationController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<Application>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ApplicationModule,
                TypeOrmModule.forRoot({
                    type: "postgres",
                    host: "host.docker.internal",
                    port: 5433,
                    username: "os2iot",
                    password: "toi2so",
                    database: "os2iot-e2e",
                    synchronize: true,
                    logging: true,
                    autoLoadEntities: true,
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("ApplicationRepository");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    afterEach(async () => {
        // Clear data after each test
        await getConnection()
            .createQueryBuilder()
            .delete()
            .from(Application)
            .execute();
    });

    it("(GET) /application/ - empty", () => {
        return request(app.getHttpServer())
            .get("/application/")
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toStrictEqual([]);
            });
    });

    it("(GET) /application/ - with elements already existing", () => {
        repository.save([
            { name: "Test", description: "Tester" },
            { name: "Application2", description: "A description" },
        ]);

        return request(app.getHttpServer())
            .get("/application/")
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(2);
                expect(response.body.data).toMatchObject([
                    { name: "Test", description: "Tester" },
                    { name: "Application2", description: "A description" },
                ]);
            });
    });

    it("(POST) /application/ - Create application", async () => {
        const testAppOne = { name: "Post Test", description: "Post Tester" };

        await request(app.getHttpServer())
            .post("/application/")
            .send(testAppOne)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "Post Test",
                    description: "Post Tester",
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
    });
});
