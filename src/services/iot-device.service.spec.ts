import { Test, TestingModule } from "@nestjs/testing";
import { IoTDeviceService } from "./iot-device.service";

describe("IoTdeviceService", () => {
    let service: IoTDeviceService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [IoTDeviceService],
        }).compile();

        service = module.get<IoTDeviceService>(IoTDeviceService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
