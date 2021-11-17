import { Test, TestingModule } from '@nestjs/testing';
import { MulticastService } from '../../src/services/device-management/multicast.service';

describe('MulticastService', () => {
  let service: MulticastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MulticastService],
    }).compile();

    service = module.get<MulticastService>(MulticastService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
