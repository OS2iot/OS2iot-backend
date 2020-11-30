import { INestApplication, Logger } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { getManager } from "typeorm";

import configuration from "@config/configuration";
import { AuthModule } from "@modules/user-management/auth.module";

import {
    clearDatabase,
    generateIoTDevice,
    generateSavedApplication,
    generateSavedConnection,
    generateSavedDataTargetWithOpenDataDk,
    generateSavedDeviceModel,
    generateSavedIoTDevice,
    generateSavedOrganization,
    generateSavedPayloadDecoder,
    generateSavedReceivedMessageAndMetadata,
} from "../test-helpers";
import { OpenDataDkSharingModule } from "@modules/open-data-dk-sharing.module";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";

describe(`${OpenDataDkSharingModule.name} (e2e)`, () => {
    let app: INestApplication;

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
                OpenDataDkSharingModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
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

    it("(GET) ​​/open-data-dk-sharing​/{organizationId} - All OK", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        await generateSavedDataTargetWithOpenDataDk(application);

        // Act
        return await request(app.getHttpServer())
            .get(`/open-data-dk-sharing/${org.id}`)
            .send()
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    "@context":
                        "https://project-open-data.cio.gov/v1.1/schema/catalog.jsonld",
                    "@type": "dcat:Catalog",
                    conformsTo: "https://project-open-data.cio.gov/v1.1/schema",
                    describedBy:
                        "https://project-open-data.cio.gov/v1.1/schema/catalog.json",
                    dataset: [
                        {
                            "@type": "dcat:Dataset",
                            accessLevel: "public",
                            identifier: expect.any(String),
                            license:
                                "http://portal.opendata.dk/dataset/open-data-dk-licens",
                            title: "E2E",
                            description: "e2e",
                            keyword: ["etKeyWord"],
                            issued: expect.any(String),
                            modified: expect.any(String),
                            publisher: { name: "E2E Test Organization" },
                            contactPoint: {
                                "@type": "vcard:Contact",
                                fn: "E2E",
                                hasEmail: "mailto:e2e@test.dk",
                            },
                            distribution: [
                                {
                                    "@type": "dcat:Distribution",
                                    mediaType: "application/json",
                                    format: "JSON",
                                    accessURL: expect.any(String),
                                    title: "Rumsensor2",
                                },
                            ],
                        },
                    ],
                });
            });
    });

    it("(GET) ​​/open-data-dk-sharing​/{organizationId} - Optional values are null", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        await generateSavedDataTargetWithOpenDataDk(application);

        // Act
        return await request(app.getHttpServer())
            .get(`/open-data-dk-sharing/${org.id}`)
            .send()
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toMatchObject({
                    "@context":
                        "https://project-open-data.cio.gov/v1.1/schema/catalog.jsonld",
                    "@type": "dcat:Catalog",
                    conformsTo: "https://project-open-data.cio.gov/v1.1/schema",
                    describedBy:
                        "https://project-open-data.cio.gov/v1.1/schema/catalog.json",
                    dataset: [
                        {
                            "@type": "dcat:Dataset",
                            accessLevel: "public",
                            identifier: expect.any(String),
                            license:
                                "http://portal.opendata.dk/dataset/open-data-dk-licens",
                            title: "E2E",
                            // description: "e2e",
                            // keyword: ["etKeyWord"],
                            issued: expect.any(String),
                            modified: expect.any(String),
                            publisher: { name: "E2E Test Organization" },
                            contactPoint: {
                                "@type": "vcard:Contact",
                                fn: "E2E",
                                hasEmail: "mailto:e2e@test.dk",
                            },
                            distribution: [
                                {
                                    "@type": "dcat:Distribution",
                                    mediaType: "application/json",
                                    format: "JSON",
                                    accessURL: expect.any(String),
                                    // title: "Rumsensor2",
                                },
                            ],
                        },
                    ],
                });
            });
    });

    it("(GET) ​​/open-data-dk-sharing​/{organizationId} - Wrong org id", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        await generateSavedDataTargetWithOpenDataDk(application);

        // Act
        return await request(app.getHttpServer())
            .get(`/open-data-dk-sharing/${org.id + 1}`)
            .send()
            // Assert
            .expect(404);
    });

    it("(GET) ​​/open-data-dk-sharing​/{organizationId}/data/{shareId} - All OK", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const iotDevice = await generateSavedIoTDevice(application);
        const dt = await generateSavedDataTargetWithOpenDataDk(application);
        const pd = await generateSavedPayloadDecoder(org);
        await generateSavedConnection(iotDevice, dt, pd);
        await generateSavedConnection(iotDevice, dt, null);

        const oddk = await getManager().findOne(OpenDataDkDataset);

        // Send data to device

        await generateSavedReceivedMessageAndMetadata(iotDevice);

        // Act
        return await request(app.getHttpServer())
            .get(`/open-data-dk-sharing/${org.id}/data/${oddk.id}`)
            .send()
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toContainEqual({
                    decoded: {
                        temperature: 27.9,
                        humidity: 49,
                        light: 139,
                        motion: 8,
                        vdd: 3645,
                    },
                });
                expect(response.body).toContainEqual({
                    chan: 3,
                    codr: "4/5",
                    data: "AQEXAjEEAIsFCAcOPQ==",
                    datr: "SF12BW125",
                    freq: 867100000,
                    lsnr: 12,
                    modu: "LORA",
                    rfch: 0,
                    rssi: -39,
                    size: 26,
                    stat: 1,
                    tmst: 71333956,
                    utmms: 1597675976328,
                });

                expect(response.body).toMatchObject({});
            });
    });

    it("(GET) ​​/open-data-dk-sharing​/{organizationId}/data/{shareId} - With Device Model - All OK", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        let iotDevice = await generateIoTDevice(application);
        const deviceModel = await generateSavedDeviceModel(org);
        iotDevice.deviceModel = deviceModel;
        iotDevice = await getManager().save(iotDevice);
        const dt = await generateSavedDataTargetWithOpenDataDk(application);
        const pd = await generateSavedPayloadDecoder(org, true);
        await generateSavedConnection(iotDevice, dt, pd);
        await generateSavedConnection(iotDevice, dt, null);

        const oddk = await getManager().findOne(OpenDataDkDataset);

        // Send data to device
        await generateSavedReceivedMessageAndMetadata(iotDevice);

        // Act
        return await request(app.getHttpServer())
            .get(`/open-data-dk-sharing/${org.id}/data/${oddk.id}`)
            .send()
            // Assert
            .expect(200)
            .expect("Content-Type", /json/)
            .then(response => {
                expect(response.body).toContainEqual({
                    decoded: {
                        temperature: 27.9,
                        humidity: 49,
                        light: 139,
                        motion: 8,
                        vdd: 3645,
                    },
                    deviceModel: {
                        brandName: "myDevice",
                        category: ["sensor"],
                        controlledProperty: ["fillingLevel", "temperature"],
                        function: ["sensing"],
                        id: "myDevice-wastecontainer-sensor-345",
                        manufacturerName: "myDevice Inc.",
                        modelName: "S4Container 345",
                        name: "myDevice Sensor for Containers 345",
                        type: "DeviceModel",
                    },
                });
                expect(response.body).toContainEqual({
                    chan: 3,
                    codr: "4/5",
                    data: "AQEXAjEEAIsFCAcOPQ==",
                    datr: "SF12BW125",
                    freq: 867100000,
                    lsnr: 12,
                    modu: "LORA",
                    rfch: 0,
                    rssi: -39,
                    size: 26,
                    stat: 1,
                    tmst: 71333956,
                    utmms: 1597675976328,
                });

                expect(response.body).toMatchObject({});
            });
    });

    it("(GET) ​​/open-data-dk-sharing​/{organizationId}/data/{shareId} - Wrong org id", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const iotDevice = await generateSavedIoTDevice(application);
        const dt = await generateSavedDataTargetWithOpenDataDk(application);
        const pd = await generateSavedPayloadDecoder(org);
        await generateSavedConnection(iotDevice, dt, pd);
        await generateSavedConnection(iotDevice, dt, null);

        const oddk = await getManager().findOne(OpenDataDkDataset);

        // Send data to device

        await generateSavedReceivedMessageAndMetadata(iotDevice);

        // Act
        return await request(app.getHttpServer())
            .get(`/open-data-dk-sharing/${org.id + 1}/data/${oddk.id}`)
            .send()
            // Assert
            .expect(404);
    });

    it("(GET) ​​/open-data-dk-sharing​/{organizationId}/data/{shareId} - Wrong dataset id", async () => {
        // Arrange
        const org = await generateSavedOrganization();
        const application = await generateSavedApplication(org);
        const iotDevice = await generateSavedIoTDevice(application);
        const dt = await generateSavedDataTargetWithOpenDataDk(application);
        const pd = await generateSavedPayloadDecoder(org);
        await generateSavedConnection(iotDevice, dt, pd);
        await generateSavedConnection(iotDevice, dt, null);

        const oddk = await getManager().findOne(OpenDataDkDataset);

        // Send data to device

        await generateSavedReceivedMessageAndMetadata(iotDevice);

        // Act
        return await request(app.getHttpServer())
            .get(`/open-data-dk-sharing/${org.id}/data/${oddk.id + 1}`)
            .send()
            // Assert
            .expect(404);
    });
});
