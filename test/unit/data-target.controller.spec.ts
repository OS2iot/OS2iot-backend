import { Test, TestingModule } from "@nestjs/testing";
import { DataTargetController } from "../../src/admin-controller/data-target.controller";

describe("DataTarget Controller", () => {
    let controller: DataTargetController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DataTargetController],
        }).compile();

        controller = module.get<DataTargetController>(DataTargetController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
