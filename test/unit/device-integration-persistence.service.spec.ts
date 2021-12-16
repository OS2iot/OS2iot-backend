import { HttpService } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { RawRequestDto } from "@dto/kafka/raw-request.dto";
import { Application } from "@entities/application.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { Organization } from "@entities/organization.entity";
import { Permission } from "@entities/permissions/permission.entity";
import { ReceivedMessage } from "@entities/received-message.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { User } from "@entities/user.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { DeviceIntegrationPersistenceService } from "@services/data-management/device-integration-persistence.service";
import { ApplicationService } from "@services/device-management/application.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { OrganizationService } from "@services/user-management/organization.service";

import {
    generateApplication,
    generateIoTDevice,
    generateSigfoxRawRequestDto,
} from "../e2e/test-helpers";

describe("DeviceIntegrationPersistenceService", () => {
    let service: DeviceIntegrationPersistenceService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: getRepositoryToken(ReceivedMessageMetadata),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(ReceivedMessage),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(GenericHTTPDevice),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(SigFoxDevice),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(IoTDevice),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(Application),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(LoRaWANDevice),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(Organization),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(Permission),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: {},
                },
                IoTDeviceService,
                DeviceIntegrationPersistenceService,
                ApplicationService,
                ChirpstackDeviceService,
                {
                    provide: HttpService,
                    useValue: {
                        post: jest.fn().mockResolvedValue([{}]),
                    },
                },
                {
                    provide: OrganizationService,
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get<DeviceIntegrationPersistenceService>(
            DeviceIntegrationPersistenceService
        );
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
    const org: Organization = {
        id: 1,
        name: "org",
        createdAt: new Date(),
        updatedAt: new Date(),
        applications: [],
        permissions: [],
        sigfoxGroups: [],
    };

    const iotDevice: IoTDevice = {
        id: 1,
        application: {
            name: "Test Application",
            description: "",
            iotDevices: [],
            dataTargets: [],
            id: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            belongsTo: org,
            permissions: [],
        },
        connections: [],
        name: "Test IoTDevice",
        metadata: JSON.parse("{}"),
        createdAt: new Date(),
        updatedAt: new Date(),
        type: IoTDeviceType.GenericHttp,
        latestReceivedMessage: null,
        receivedMessagesMetadata: [],
    };

    it("test mapDtoToNewReceivedMessageMetadata - Sigfox data + with timestmap", async () => {
        // Arrange
        const dto: RawRequestDto = generateSigfoxRawRequestDto();
        const application = generateApplication();
        const relatedIoTDevice: IoTDevice = generateIoTDevice(application);

        // Act
        const metadata: ReceivedMessageMetadata = service.mapDtoToNewReceivedMessageMetadata(
            dto,
            relatedIoTDevice
        );

        // Assert
        expect(metadata.device).toMatchObject(relatedIoTDevice);
        expect(metadata.sentTime).toStrictEqual(new Date(dto.unixTimestamp));
    });

    it("test mapDtoToReceivedMessage - Sigfox data + with timestmap", () => {
        // Arrange
        const dto: RawRequestDto = generateSigfoxRawRequestDto();
        const existingMessage = new ReceivedMessage();
        const relatedIoTDevice: IoTDevice = iotDevice;

        // Act
        const message: ReceivedMessage = service.mapDtoToReceivedMessage(
            dto,
            existingMessage,
            relatedIoTDevice
        );

        // Assert
        expect(message.device).toMatchObject(relatedIoTDevice);
        expect(message.sentTime).toStrictEqual(new Date(dto.unixTimestamp));
        expect(message.rawData).toMatchObject(dto.rawPayload);
    });
});
