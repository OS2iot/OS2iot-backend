import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { Repository } from "typeorm";

import configuration from "@config/configuration";
import { AuthModule } from "@modules/user-management/auth.module";

import {
    clearDatabase,
    generateDeviceModel,
    generateSavedDeviceModel,
    generateSavedGlobalAdminUser,
    generateSavedOrganization,
    generateValidJwtForUser,
} from "../test-helpers";
import { DeviceModelController } from "@admin-controller/device-model.controller";
import { DeviceModelModule } from "@modules/device-management/device-model.module";
import { Organization } from "@entities/organization.entity";
import { DeviceModel } from "@entities/device-model.entity";
import { CreateDeviceModelDto } from "@dto/create-device-model.dto";
import { UpdateDeviceModelDto } from "@dto/update-device-model.dto";
import { User } from "@entities/user.entity";
import { AuditLog } from "@services/audit-log.service";

describe(`${DeviceModelController.name} (e2e)`, () => {
    let app: INestApplication;
    let repository: Repository<DeviceModel>;
    let globalAdminJwt: string;
    let globalAdmin: User;
    let org: Organization;

    let auditLogSuccessListener: any;
    let auditLogFailListener: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ load: [configuration] }),
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
                DeviceModelModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        repository = moduleFixture.get("DeviceModelRepository");

        auditLogSuccessListener = jest.spyOn(AuditLog, "success");
        auditLogFailListener = jest.spyOn(AuditLog, "fail");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        await clearDatabase();
        // Create user (global admin)
        globalAdmin = await generateSavedGlobalAdminUser();
        // Generate store jwt
        globalAdminJwt = generateValidJwtForUser(globalAdmin);
        org = await generateSavedOrganization();
    });

    afterEach(async () => {
        await clearDatabase();
        jest.clearAllMocks();
    });

    it("(GET) /device-model/:id - none", async () => {
        const id = 1;
        const response = await request(app.getHttpServer())
            .get("/device-model/" + id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(404)
            .expect("Content-Type", /json/);
        await expect(response.body).toMatchObject({
            message: `MESSAGE.ID-DOES-NOT-EXIST`,
        });
    });

    it("(GET) /device-model/:id - one", async () => {
        const deviceModel = await generateSavedDeviceModel(org, "my device model");

        return await request(app.getHttpServer())
            .get("/device-model/" + deviceModel.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                // console.log(response.body);
                expect(response.body).toMatchObject({
                    id: deviceModel.id,
                    body: {
                        name: "my device model",
                    },
                });
            });
    });

    it("(GET) /device-model/ - get all", async () => {
        const deviceModel = await generateSavedDeviceModel(org, "my device model");
        return await request(app.getHttpServer())
            .get(`/device-model?organizationId=${org.id}`)
            .auth(globalAdminJwt, { type: "bearer" })
            .send()
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body.count).toBe(1);
                expect(response.body.data[0]).toMatchObject({
                    id: deviceModel.id,
                    body: {
                        name: "my device model",
                    },
                });
            });
    });

    it("(POST) /device-model/ - create new", async () => {
        const body = generateDeviceModel(org).body;
        const dto: CreateDeviceModelDto = {
            belongsToId: org.id,
            body: body,
        };

        await request(app.getHttpServer())
            .post("/device-model/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(201)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    body: body,
                    createdBy: globalAdmin.id,
                    updatedBy: globalAdmin.id,
                });
            });

        const orgFromDb = await repository.findOne();
        expect(orgFromDb).toMatchObject({
            body: body,
        });

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(POST) /device-model/ - Bad model, missing type", async () => {
        const body = {
            id: "myDevice-wastecontainer-sensor-345",
            name: "a name ",
            // type: "DeviceModel",
            category: ["sensor"],
            function: ["sensing"],
            brandName: "myDevice",
            modelName: "S4Container 345",
            manufacturerName: "myDevice Inc.",
            controlledProperty: ["fillingLevel", "temperature"],
        };
        const dto: CreateDeviceModelDto = {
            belongsToId: org.id,
            body: JSON.parse(JSON.stringify(body)),
        };

        await request(app.getHttpServer())
            .post("/device-model/")
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Bad Request",
                    message: [
                        {
                            property: "type",
                            constraints: {
                                required: "should have required property 'type'",
                            },
                        },
                    ],
                });
            });

        expect(auditLogSuccessListener).not.toHaveBeenCalled();
        expect(auditLogFailListener).toHaveBeenCalled();
    });

    it("(PUT) /device-model/:id - bad change", async () => {
        const deviceModel = await generateSavedDeviceModel(org, "my device model");
        const body = {
            id: "myDevice-wastecontainer-sensor-345",
            name: "a name ",
            type: "DeviceModel",
            category: ["sensor"],
            function: ["sensing"],
            // brandName: "myDevice",
            modelName: "S4Container 345",
            manufacturerName: "myDevice Inc.",
            controlledProperty: ["fillingLevel", "temperature"],
        };
        const dto: UpdateDeviceModelDto = {
            body: JSON.parse(JSON.stringify(body)),
        };
        await request(app.getHttpServer())
            .put("/device-model/" + deviceModel.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(400)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    error: "Bad Request",
                    message: [
                        {
                            property: "brandName",
                            constraints: {
                                required: "should have required property 'brandName'",
                            },
                        },
                    ],
                });
            });

        expect(auditLogSuccessListener).not.toHaveBeenCalled();
        expect(auditLogFailListener).toHaveBeenCalled();
    });

    it("(PUT) /device-model/:id - OK", async () => {
        const deviceModel = await generateSavedDeviceModel(org, "my device model");
        const body = {
            id: "myDevice-wastecontainer-sensor-345",
            name: "a new name!",
            type: "DeviceModel",
            category: ["sensor"],
            function: ["sensing"],
            brandName: "myDevice",
            modelName: "S4Container 345",
            manufacturerName: "myDevice Inc.",
            controlledProperty: ["fillingLevel", "temperature"],
        };
        const dto: UpdateDeviceModelDto = {
            body: JSON.parse(JSON.stringify(body)),
        };
        await request(app.getHttpServer())
            .put("/device-model/" + deviceModel.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .send(dto)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    updatedBy: globalAdmin.id,
                    body: {
                        name: "a new name!",
                    },
                });
            });
        const orgFromDb = await repository.findOne();
        expect(orgFromDb).toMatchObject({
            body: body,
        });

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });

    it("(DELETE) /device-model/:id - OK", async () => {
        const deviceModel = await generateSavedDeviceModel(org, "my device model");
        expect(await repository.findOne()).not.toBeNull();

        await request(app.getHttpServer())
            .delete("/device-model/" + deviceModel.id)
            .auth(globalAdminJwt, { type: "bearer" })
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    affected: 1,
                });
            });

        expect(auditLogSuccessListener).toHaveBeenCalled();
        expect(auditLogFailListener).not.toHaveBeenCalled();
    });
});
