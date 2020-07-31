import { Test, TestingModule } from "@nestjs/testing";
import { KafkaService } from "@services/kafka/kafka.service";

describe("KafkaService", () => {
    let service: KafkaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: KafkaService,
                    useValue: new KafkaService({
                        clientId: "os2iot-client",
                        brokers: ["host.docker.internal:9093"],
                        groupId: "os2iot-backend",
                    }),
                },
            ],
        }).compile();

        service = module.get<KafkaService>(KafkaService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
