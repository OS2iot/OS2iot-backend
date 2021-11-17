import { Test, TestingModule } from '@nestjs/testing';
import { MulticastController } from '../../src/controllers/admin-controller/multicast.controller';
import { MulticastService } from '../../src/services/device-management/multicast.service';

describe('MulticastController', () => {
  let controller: MulticastController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MulticastController],
      providers: [MulticastService],
    }).compile();

    controller = module.get<MulticastController>(MulticastController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
