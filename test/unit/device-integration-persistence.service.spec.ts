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
                IoTDeviceService,
                DeviceIntegrationPersistenceService,
                ApplicationService,
            ],
        }).compile();

        service = module.get<DeviceIntegrationPersistenceService>(
            DeviceIntegrationPersistenceService
        );
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    const sampleRawRequestDto = {
        rawPayload: JSON.parse(`{
                "data": "c6099764",
                "sigfoxId": "B445A9",
                "time": "1596721546",
                "snr": "12.53",
                "rssi": "-123.00",
                "avgSnr": "null",
                "station": "37FF",
                "seqNumber": "1",
                "latStation": "null",
                "lngStation": "null",
                "ack": "false"
            }`),
        iotDeviceId: 1,
        unixTimestamp: 1596721546,
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
        },
        name: "Test IoTDevice",
        metadata: JSON.parse("{}"),
        createdAt: new Date(),
        updatedAt: new Date(),
        type: IoTDeviceType.GenericHttp,
        latestReceivedMessage: null,
        receivedMessagesMetadata: [],
    };

    it("test mapDtoToNewReceivedMessageMetadata - Sigfox data + with timestmap", () => {
        // Arrange
        const dto: RawRequestDto = sampleRawRequestDto;
        const relatedIoTDevice: IoTDevice = iotDevice;

        // Act
        const metadata: ReceivedMessageMetadata = service.mapDtoToNewReceivedMessageMetadata(
            dto,
            relatedIoTDevice
        );

        // Assert
        expect(metadata.device.id).toBe(1);
        expect(metadata.sentTime).toStrictEqual(new Date(sampleRawRequestDto.unixTimestamp));
    });

    it("test mapDtoToReceivedMessage - Sigfox data + with timestmap", () => {
        // Arrange
        const dto: RawRequestDto = sampleRawRequestDto;
        const existingMessage = new ReceivedMessage();
        const relatedIoTDevice: IoTDevice = iotDevice;

        // Act
        const message: ReceivedMessage = service.mapDtoToReceivedMessage(
            dto,
            existingMessage,
            relatedIoTDevice
        );

        // Assert
        expect(message.device.id).toBe(1);
        expect(message.sentTime).toStrictEqual(new Date(sampleRawRequestDto.unixTimestamp));
        expect(message.rawData).toMatchObject(sampleRawRequestDto.rawPayload);
    });
});
