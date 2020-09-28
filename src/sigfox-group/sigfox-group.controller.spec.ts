import { Test, TestingModule } from '@nestjs/testing';
import { SigfoxGroupController } from '../controllers/admin-controller/sigfox/sigfox-group.controller';

describe('SigfoxGroupController', () => {
  let controller: SigfoxGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SigfoxGroupController],
    }).compile();

    controller = module.get<SigfoxGroupController>(SigfoxGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
