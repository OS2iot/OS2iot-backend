import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationModule } from "@modules/application.module";
import { Repository } from "typeorm";
import { Application } from "@entities/application.entity";
import { clearDatabase } from "./test-helpers";

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
                    database: "os2iot",
                    synchronize: true,
                    logging: false,
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

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
    });

    afterEach(async () => {
        // Clear data after each test
        await clearDatabase();
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

    it("(GET) /application/ - with elements already existing", async () => {
        await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
            {
                name: "Application2",
                description: "A description",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        return request(app.getHttpServer())
            .get("/application/")
            .send()
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(2);
                expect(response.body.data).toMatchObject([
                    { name: "Test", description: "Tester" },
                    {
                        name: "Application2",
                        description: "A description",
                    },
                ]);
            });
    });

    it("(GET) /application/ - with pagination", async () => {
        await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
            {
                name: "Application2",
                description: "A description",
                iotDevices: [],
                dataTargets: [],
            },
            {
                name: "Application3",
                description: "A third description",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        return request(app.getHttpServer())
            .get("/application?limit=1&offset=1")
            .send()
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                // Expect that the count it 3 since there is 3 objects saved in the database
                expect(response.body.count).toBe(3);
                // Expect that only one was returned
                expect(response.body.data).toHaveLength(1);
                expect(response.body.data).toMatchObject([
                    {
                        name: "Application2",
                        description: "A description",
                    },
                ]);
            });
    });

    it("(GET) /application/:id - Get one element by id", async () => {
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        const id = application[0].id;

        return request(app.getHttpServer())
            .get(`/application/${id}`)
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "Test",
                    description: "Tester",
                });
            });
    });

    it("(GET) /application/:id - Get one element by id - not found", async () => {
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        // should not exist
        const id = application[0].id + 1;

        return request(app.getHttpServer())
            .get(`/application/${id}`)
            .expect(404)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: `MESSAGE.ID-DOES-NOT-EXIST`,
                });
            });
    });

    it("(POST) /application/ - Create application", async () => {
        const testAppOne = {
            name: "Post Test",
            description: "Post Tester",
            iotDevices: [] as any,
            dataTargets: [] as any,
        };

        await request(app.getHttpServer())
            .post("/application/")
            .send(testAppOne)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "Post Test",
                    description: "Post Tester",
                    iotDevices: [] as any[],
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
    });

    it("(DELETE) /application/ - Delete application", async () => {
        const application = await repository.save([
            {
                name: "test sletning",
                description: "test sletning description",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
        const id = application[0].id;

        await request(app.getHttpServer())
            .delete(`/application/${id}`)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    affected: 1,
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(0);
    });

    it("(DELETE) /application/ - Delete application - Not existing", async () => {
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
        const id = application[0].id + 1; // Doesn't exist

        await request(app.getHttpServer())
            .delete(`/application/${id}`)
            .expect(404)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    status: 404,
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
    });

    it("(PUT) /application/ - Change application", async () => {
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
        const id = application[0].id;

        const putTest = { name: "PUT Test", description: "PUT Tester" };

        await request(app.getHttpServer())
            .put(`/application/${id}`)
            .send(putTest)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: id,
                    name: "PUT Test",
                    description: "PUT Tester",
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
        expect(applicationInDatabase[0]).toMatchObject({
            id: id,
            name: "PUT Test",
            description: "PUT Tester",
        });
    });
});
