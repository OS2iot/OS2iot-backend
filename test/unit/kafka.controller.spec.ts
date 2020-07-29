import { Test, TestingModule } from '@nestjs/testing';
import { KafkaController } from '../../src/device-data-controller/kafka.controller';

describe('Kafka Controller', () => {
  let controller: KafkaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KafkaController],
    }).compile();

    controller = module.get<KafkaController>(KafkaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
