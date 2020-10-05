import { Test, TestingModule } from '@nestjs/testing';
import { SigfoxApiGroupService } from './sigfox-api-group.service';

describe('SigfoxApiGroupService', () => {
  let service: SigfoxApiGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SigfoxApiGroupService],
    }).compile();

    service = module.get<SigfoxApiGroupService>(SigfoxApiGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
