import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, Logger } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RecieveDataModule } from "@modules/recieve-data.module";
import { Repository, getManager } from "typeorm";
import { RecieveData } from "@entities/recieve-data.entity";
import { clearDatabase } from "./test-helpers";
import { Application } from "@entities/applikation.entity";
import { ApplicationModule } from "@modules/application.module";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";

describe("RecieveDataController (e2e)", () => {
    let app: INestApplication;
    let recieveDataRepository: Repository<RecieveData>;
    let applicationRepository: Repository<Application>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ApplicationModule,
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

        // Get a reference to the recieveDataRepository such that we can CRUD on it.
        recieveDataRepository = moduleFixture.get("RecieveDataRepository");
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
                    iotDevices: [] as any[],
                });
            });

        const applicationInDatabase: Application[] = await applicationRepository.find();
        expect(applicationInDatabase).toHaveLength(1);
    });


    it("(POST) /iot-device/", async () => {
        const applications = await applicationRepository.save([
            { name: "Test", description: "Tester", iotDevices: [] },
        ]);
        const appId = applications[0].id;
        const testIoTDevice = {
            name: "created",
            type: "GENERIC_HTTP",
            applicationId: appId,
            comment: "string",
        };
        return await request(app.getHttpServer())
            .post("/iot-device/")
            .send(testIoTDevice)
            .expect(201)

            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    name: "created",
                    type: "GENERIC_HTTP",
                    application: {
                        id: appId,
                    },
                    comment: "string",
                    location: null,
                    commentOnLocation: null,
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
        device.apiKey = "asdf";

        const manager = getManager();
        const iotDevice = await manager.save(device);

        const iotDeviceId = iotDevice.id;
        return await request(app.getHttpServer())
            .get("/iot-device/" + iotDeviceId)
            .expect(200)

            .expect("Content-Type", /json/)
            .then(response => {
                // console.log(response.body);
                // TODO: get apiKey out of body and pass it to the next text
                expect(response.body).toMatchObject({
                    name: "HTTP device",
                    application: {
                        id: appId,
                    },
                });
            });
    });

    //TODO:1. Skriv test hvor apiKey er forkert 
    it("(POST) /recieveData/ - Create application", async () => {
        const testAppOne = { apiKey: "a087911a-dc19-440d-94ff-72cc40cc8a69", body: "{\"TestData\":1}" };
      /**
             {
             "statusCode": 400,
            "message": "Unexpected token s in JSON at position 0",
            "error": "Bad Request"
            }
        */
        await request(app.getHttpServer()) 
            .post("/recieveData/")
            .send(testAppOne)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                          "response": {
                            "status": 204,
                            "error": "204 No Content",
                            "description": "204 No Content"
                          },
                          "status": 204,
                          "message": "Http Exception"
                        });
            });

    });
    //TODO: 2. Skriv test hvor data er formaeret forkert(invalid json)
    it("(POST) /recieveData/ - Create application", async () => {
        const testAppOne = { apiKey: "a087911a-dc19-440d-94ff-72cc40cc8a69", body: "{\"TestData\"1" };
            /*
                {   
                    //Når device apiKey er forkert
                    status: HttpStatus.FORBIDDEN,
                    error: "403 Forbidden",
                    description: "403 Forbidden",
                }
            */
        await request(app.getHttpServer()) 
            .post("/recieveData/")
            .send(testAppOne)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                          "response": {
                            "status": 204,
                            "error": "204 No Content",
                            "description": "204 No Content"
                          },
                          "status": 204,
                          "message": "Http Exception"
                        });
            });

    });
    //TODO:3. Skriv test hvor data og apiKey er korrekt
    it("(POST) /recieveData/ - Create application", async () => {
        const testAppOne = { apiKey: "a087911a-dc19-440d-94ff-72cc40cc8a69", body: "{\"TestData\":1}" };
        /*
            {
                //return "204 No Content";
                status: HttpStatus.NO_CONTENT,
                error: "204 No Content",
                description:  "204 No Content",
            },
         */
        await request(app.getHttpServer())
            .post("/recieveData/")
            .send(testAppOne)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                          "response": {
                            "status": 204,
                            "error": "204 No Content",
                            "description": "204 No Content"
                          },
                          "status": 204,
                          "message": "Http Exception"
                        });
            });

    });

});

