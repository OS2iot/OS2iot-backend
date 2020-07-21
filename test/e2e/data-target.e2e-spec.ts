import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { Application } from "@entities/application.entity";
import { clearDatabase } from "./test-helpers";
import { DataTarget } from "@entities/data-target.entity";
import { DataTargetModule } from "../../src/modules/data-target.module";
import { HttpPushDataTarget } from "../../src/entities/http-push-data-target.entity";

describe("DataTargetController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<HttpPushDataTarget>;
    let applicationRepository: Repository<Application>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                DataTargetModule,
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
        repository = moduleFixture.get("HttpPushDataTargetRepository");
        applicationRepository = moduleFixture.get("ApplicationRepository");
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

    const createDataTarget = async (
        applications: Application[]
    ): Promise<DataTarget> => {
        const dataTarget = new HttpPushDataTarget();
        dataTarget.name = "my data target";
        dataTarget.url = "http://example.com";
        dataTarget.application = applications[0];
        // @Hack: to call beforeInsert (private)
        (dataTarget as any).beforeInsert();

        const manager = getManager();
        return await manager.save(dataTarget);
    };

    const createApplications = async (): Promise<Application[]> => {
        return await applicationRepository.save([
            {
                name: "sample application",
                description: "sample description",
                iotDevices: [],
                dataTargets: [],
            },
            {
                name: "my application",
                description: "my cool application",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
    };

    it("(GET) /data-target/ - empty", () => {
        return request(app.getHttpServer())
            .get("/data-target/")
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toStrictEqual([]);
            });
    });

    it("(GET) /data-target/ - 1 result", async () => {
        const applications = await createApplications();
        const appId = applications[0].id;
        await createDataTarget(applications);

        return await request(app.getHttpServer())
            .get("/data-target/")
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data).toMatchObject([
                    {
                        name: "my data target",
                        type: "HTTP_PUSH",
                        url: "http://example.com",
                        application: {
                            id: appId,
                        },
                    },
                ]);
            });
    });

    it("(GET) /data-target/:id - found", async () => {
        const applications = await createApplications();
        const appId = applications[0].id;
        const dataTarget = await createDataTarget(applications);
        const dataTargetId = dataTarget.id;

        return await request(app.getHttpServer())
            .get(`/data-target/${dataTargetId}`)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    id: dataTargetId,
                    name: "my data target",
                    type: "HTTP_PUSH",
                    url: "http://example.com",
                    application: {
                        id: appId,
                    },
                });
            });
    });

    it("(GET) /data-target/:id - not found", async () => {
        const applications = await createApplications();
        const appId = applications[0].id;
        const dataTarget = await createDataTarget(applications);
        const wrongDataTargetId = dataTarget.id + 1;

        return await request(app.getHttpServer())
            .get(`/data-target/${wrongDataTargetId}`)
            .expect(404)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Not Found",
                });
            });
    });
});
