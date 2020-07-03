import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository, getConnection } from "typeorm";
import { Application } from "@entities/applikation.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { GenericHTTPDevice } from "../../src/entities/generic-http-device.entity";

describe("IoTDeviceController (e2e)", () => {
    let app: INestApplication;
    let repository: Repository<IoTDevice>;
    let applicationRepository: Repository<IoTDevice>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                IoTDeviceModule,
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
        repository = moduleFixture.get("IoTDeviceRepository");
        applicationRepository = moduleFixture.get("ApplicationRepository");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        // Clear data after each test
        await getConnection()
            .createQueryBuilder()
            .delete()
            .from(Application)
            .execute();

        await getConnection()
            .createQueryBuilder()
            .delete()
            .from(IoTDevice)
            .execute();
    });

    it("(GET) /iot-device/:id - none", () => {
        const id = 1;
        return request(app.getHttpServer())
            .get("/iot-device/" + id)
            .expect(404)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    message: `No element found by id: ${id}`,
                });
            });
    });

    it("(GET) /iot-device/:id - one", async () => {
        const applications = await applicationRepository.save([
            { name: "Test", description: "Tester", iotDevices: [] },
        ]);
        const appId = applications[0].id;

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];

        const iotDevice = await repository.save([device]);

        const iotDeviceId = iotDevice[0].id;
        return request(app.getHttpServer())
            .get("/iot-device/" + iotDeviceId)
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "IoT device",
                    type: "GENERIC_HTTP",
                    application: {
                        id: appId,
                    },
                });
            });
    });
});
