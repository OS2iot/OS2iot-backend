import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationModule } from "@modules/application.module";
import { Repository, getManager } from "typeorm";
import { Application } from "@entities/application.entity";
import { clearDatabase } from "./test-helpers";
import { KafkaModule } from "@modules/kafka.module";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";

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
                    logging: false,
                    autoLoadEntities: true,
                }),
                KafkaModule.register({
                    clientId: "os2iot-client-e2e",
                    brokers: ["host.docker.internal:9093"],
                    groupId: "os2iot-backend-e2e",
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
                expect(response.body.data).toContainEqual({
                    name: "Test",
                    description: "Tester",
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                    id: expect.any(Number),
                    iotDevices: [],
                });
                expect(response.body.data).toContainEqual({
                    name: "Application2",
                    description: "A description",
                    updatedAt: expect.any(String),
                    createdAt: expect.any(String),
                    id: expect.any(Number),
                    iotDevices: [],
                });
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
                    dataTargets: [] as any[],
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
    });

    it("(POST) /application/ - Create application - fail as name is not unique", async () => {
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);

        const testAppOne = {
            name: application[0].name,
            description: "Post Tester",
            iotDevices: [] as any,
            dataTargets: [] as any,
        };

        await request(app.getHttpServer())
            .post("/application/")
            .send(testAppOne)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Bad Request",
                    message: "MESSAGE.NAME-INVALID-OR-ALREADY-IN-USE",
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

    it("(PUT) /application/ - Change application - to same name allowed", async () => {
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
        const id = application[0].id;

        const putTest = {
            name: application[0].name,
            description: "PUT Tester",
        };

        await request(app.getHttpServer())
            .put(`/application/${id}`)
            .send(putTest)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: id,
                    name: application[0].name,
                    description: "PUT Tester",
                });
            });

        const applicationInDatabase: Application[] = await repository.find();
        expect(applicationInDatabase).toHaveLength(1);
        expect(applicationInDatabase[0]).toMatchObject({
            id: id,
            name: application[0].name,
            description: "PUT Tester",
        });
    });

    it("(PUT) /application/ - Change application - to same name allowed of another, not allowed", async () => {
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
            {
                name: "Test2",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
        const id = application[0].id;

        const putTest = {
            name: application[1].name,
            description: "PUT Tester",
        };

        await request(app.getHttpServer())
            .put(`/application/${id}`)
            .send(putTest)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Bad Request",
                    message: "MESSAGE.NAME-INVALID-OR-ALREADY-IN-USE",
                });
            });
    });

    it("(PUT) /application/ - Change application - show iotdevices and datatargets in results", async () => {
        // Arrange
        const application = await repository.save([
            {
                name: "Test",
                description: "Tester",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
        const id = application[0].id;

        const device = new GenericHTTPDevice();
        device.name = "E2E Test GENERIC HTTP device";
        device.application = application[0];
        device.apiKey = "DUMMY-API-KEY";
        device.metadata = JSON.parse('{"some_key": "a_value"}');

        const savedIoTDevice = await getManager().save(device);

        const putTest = {
            name: `${application[0].name} changed`,
            description: `${application[0].description} changed`,
            // NO IOTDEVICE ARRAY
            // NO DATA TARGET ARRAY
        };

        // Act
        await request(app.getHttpServer())
            .put(`/application/${id}`)
            .send(putTest)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // Assert
                expect(response.body).toMatchObject({
                    name: "Test changed",
                    description: "Tester changed",
                    iotDevices: [{ id: savedIoTDevice.id }],
                    dataTargets: [],
                });
            });
    });
});
