import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { Application } from "@entities/application.entity";
import {
    clearDatabase,
    generateSavedGlobalAdminUser,
    generateValidJwtForUser,
} from "../test-helpers";
import { DataTarget } from "@entities/data-target.entity";
import { DataTargetModule } from "@modules/data-target.module";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { DataTargetType } from "@enum/data-target-type.enum";
import { KafkaModule } from "@modules/kafka.module";
import { ConfigModule } from "@nestjs/config";
import configuration from "@config/configuration";

describe("DataTargetController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<HttpPushDataTarget>;
    let applicationRepository: Repository<Application>;
    let globalAdminJwt: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ load: [configuration] }),
                DataTargetModule,
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
        // Create user (global admin)
        const user = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(user);
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
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
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
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
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

    it("(GET) /data-target/ - with applicationId filter", async () => {
        const applications = await createApplications();
        const appId = applications[0].id;
        await createDataTarget(applications);

        return await request(app.getHttpServer())
            .get(`/data-target?applicationId=${appId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
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

    it("(GET) /data-target/ - with applicationId filter - but non matching appId", async () => {
        const applications = await createApplications();
        const appId = applications[0].id;
        await createDataTarget(applications);

        return await request(app.getHttpServer())
            .get(`/data-target?applicationId=${appId + 1}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(0);
                expect(response.body.data).toMatchObject([]);
            });
    });

    it("(GET) /data-target/:id - found", async () => {
        const applications = await createApplications();
        const appId = applications[0].id;
        const dataTarget = await createDataTarget(applications);
        const dataTargetId = dataTarget.id;

        return await request(app.getHttpServer())
            .get(`/data-target/${dataTargetId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
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
        const dataTarget = await createDataTarget(applications);
        const wrongDataTargetId = dataTarget.id + 1;

        return await request(app.getHttpServer())
            .get(`/data-target/${wrongDataTargetId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(404)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Not Found",
                });
            });
    });

    it("(POST) /data-target/ - create new data target", async () => {
        const applications = await createApplications();
        const applicationId = applications[0].id;
        const dataTargetBody: CreateDataTargetDto = {
            name: "et navn",
            applicationId: applicationId,
            type: DataTargetType.HttpPush,
            url: "http://example.com/test-endepunkt",
            timeout: 3000,
            authorizationHeader: null,
        };

        await request(app.getHttpServer())
            .post(`/data-target/`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dataTargetBody)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "et navn",
                    application: {
                        id: applicationId,
                    },
                    type: "HTTP_PUSH",
                    url: "http://example.com/test-endepunkt",
                });
            });

        const dataTargetsInDb = await repository.find();
        expect(dataTargetsInDb).toHaveLength(1);
        expect(dataTargetsInDb[0]).toMatchObject({
            name: "et navn",
        });
    });

    it("(POST) /data-target/ - application missing from request", async () => {
        const dataTargetBody = {
            name: "et navn",
            type: DataTargetType.HttpPush,
            url: "http://example.com/test-endepunkt",
            timeout: 3000,
        };

        return await request(app.getHttpServer())
            .post(`/data-target/`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dataTargetBody)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: `MESSAGE.ID-MISSING-FROM-REQUEST`,
                });
            });
    });

    it("(POST) /data-target/ - application not found", async () => {
        const dataTargetBody = {
            name: "et navn",
            applicationId: 1,
            type: DataTargetType.HttpPush,
            url: "http://example.com/test-endepunkt",
            timeout: 3000,
        };

        return await request(app.getHttpServer())
            .post(`/data-target/`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dataTargetBody)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: `MESSAGE.ID-DOES-NOT-EXIST`,
                });
            });
    });

    it("(PUT) /data-target/:id - change existing", async () => {
        const applications = await createApplications();
        const applicationId = applications[0].id;

        const dataTarget = await createDataTarget(applications);
        const dataTargetId = dataTarget.id;
        const dataTargetBody: CreateDataTargetDto = {
            name: "et navn",
            applicationId: applicationId,
            type: DataTargetType.HttpPush,
            url: "http://example.com/test-endepunkt",
            timeout: 3000,
            authorizationHeader: null,
        };

        return await request(app.getHttpServer())
            .put(`/data-target/${dataTargetId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dataTargetBody)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "et navn",
                });
            });
    });

    it("(DELETE) /data-target/:id - not found", async () => {
        const applications = await createApplications();
        const dataTarget = await createDataTarget(applications);
        const wrongDataTargetId = dataTarget.id + 1;

        return await request(app.getHttpServer())
            .delete(`/data-target/${wrongDataTargetId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(404)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    status: 404,
                });
            });
    });

    it("(DELETE) /data-target/:id - deleted", async () => {
        const applications = await createApplications();
        const dataTarget = await createDataTarget(applications);
        const wrongDataTargetId = dataTarget.id;

        return await request(app.getHttpServer())
            .delete(`/data-target/${wrongDataTargetId}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    affected: 1,
                });
            });
    });
});
