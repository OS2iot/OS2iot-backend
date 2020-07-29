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
                    database: "os2iot-e2e",
                    synchronize: true,
                    logging: false,
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
    const dataToSend = {
        string1: "string1",
        string2: "string2",
        number: 1,
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

        const response = await request(app.getHttpServer())
            .post("/recieve-data/?apiKey=" + oldUuid)
            .send(dataToSend)
            .expect(204);
        return response;
    });

    it("(POST) /recieve-data/  Insert invalid API key - expected 403- fobbidden", async () => {
        const response = await request(app.getHttpServer())
            .post("/recieve-data/?apiKey=" + "invalidKey")
            .send(dataToSend)
            .expect(403);
        return response;
    });
});
