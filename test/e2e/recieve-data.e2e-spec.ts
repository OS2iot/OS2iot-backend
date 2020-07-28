import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, Logger } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { clearDatabase } from "./test-helpers";
import { RecieveDataModule } from "@modules/recieve-data.module";
import { Application } from "@entities/application.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { DataTarget } from "@entities/data-target.entity";
import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { DataTargetType } from "@enum/data-target-type.enum";
import { application } from "express";

describe("RecieveDataController (e2e)", () => {
    let app: INestApplication;
    let applicationRepository: Repository<Application>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                RecieveDataModule,
                TypeOrmModule.forRoot({
                    type: "postgres",
                    host: "host.docker.internal",
                    port: 5433,
                    username: "os2iot",
                    password: "toi2so",
                    database: "os2iot",
                    synchronize: true,
                    logging: true,
                    autoLoadEntities: true,
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        applicationRepository = moduleFixture.get("ApplicationRepository");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        await clearDatabase();
    });

    afterEach(async () => {
        await clearDatabase();
    });

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

    it("(POST) /recieve-data/ Insert data with correct API key - expected 204", async () => {
        const applications = await createApplications();

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        // @Hack: to call beforeInsert (private)
        (device as any).beforeInsert();

        const manager = getManager();
        const savedIoTDevice = await manager.save(device);

        const oldUuid = savedIoTDevice.apiKey;

        const dataToSend = {
            string1: "string1",
            string2: "string2",
            number: 1,
        };

        Logger.log(oldUuid);
        const response = await request(app.getHttpServer())
            .post("/recieve-data/?apiKey=" + oldUuid)
            .send(dataToSend)
            .expect(204);

        Logger.log(response);
        return response;
    });

    it("(POST) /recieve-data/  Insert invalid API key - expected 403- fobbidden", async () => {
        const dataToSend = {
            string1: "string1",
            string2: "string2",
            number: 1,
        };

        const response = await request(app.getHttpServer())
            .post("/recieve-data/?apiKey=" + "invalidKey")
            .send(dataToSend)
            .expect(403);

        Logger.log(response);
        return response;
    });

    it("(POST) /recieve-data/ Insert invalid json - expected 400", async () => {
        const applications = await createApplications();

        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        // @Hack: to call beforeInsert (private)
        (device as any).beforeInsert();

        const manager = getManager();
        const savedIoTDevice = await manager.save(device);

        const oldUuid = savedIoTDevice.apiKey;
        const response = await request(app.getHttpServer())
            .post("/recieve-data/?apiKey=" + oldUuid)
            .send("invalidData")
            .expect(204)
            .then(response => {
                expect(response.body).toMatchObject("
                    {
                    \"error\": \"Bad Request\",
                    \"message\": \"Unexpected token a in JSON at position 1\",
        \"statusCode\": 400,
    }");
            });

        Logger.log(response);
        return response;
    });
});
