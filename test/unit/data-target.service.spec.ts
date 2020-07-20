import { Test, TestingModule } from "@nestjs/testing";
import { DataTargetService } from "@services/data-target.service";

describe("DataTargetService", () => {
    let service: DataTargetService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DataTargetService],
        }).compile();

        service = module.get<DataTargetService>(DataTargetService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
