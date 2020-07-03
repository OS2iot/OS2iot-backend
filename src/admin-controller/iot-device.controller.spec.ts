import { Test, TestingModule } from '@nestjs/testing';
import { IoTDeviceController } from './iot-device.controller';

describe('IoTdevice Controller', () => {
  let controller: IoTDeviceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IoTDeviceController],
    }).compile();

    controller = module.get<IoTDeviceController>(IoTDeviceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
