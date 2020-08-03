import { Test, TestingModule } from "@nestjs/testing";
import { DeviceIntegrationPersistenceService } from "../../src/services/data-management/device-integration-persistence.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ReceivedMessage } from "@entities/received-message";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { IoTDeviceService } from "@services/iot-device.service";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { Application } from "@entities/application.entity";
import { ApplicationService } from "@services/application.service";

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
});
