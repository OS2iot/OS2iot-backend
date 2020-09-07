import { Test, TestingModule } from "@nestjs/testing";
import { DeviceIntegrationPersistenceService } from "@services/data-management/device-integration-persistence.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ReceivedMessage } from "@entities/received-message";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { IoTDeviceService } from "@services/iot-device.service";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { Application } from "@entities/application.entity";
import { ApplicationService } from "@services/application.service";
import { RawRequestDto } from "@entities/dto/kafka/raw-request.dto";
import { IoTDeviceType } from "@enum/device-type.enum";
import {
    generateSigfoxRawRequestDto,
    generateIoTDevice,
    generateApplication,
} from "../e2e/test-helpers";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { HttpService } from "@nestjs/common";

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
            ],
        }).compile();

        service = module.get<DeviceIntegrationPersistenceService>(
            DeviceIntegrationPersistenceService
        );
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

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
        },
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
