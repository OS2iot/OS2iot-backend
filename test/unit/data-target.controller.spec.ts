import { Test, TestingModule } from "@nestjs/testing";
import { DataTargetController } from "@admin-controller/data-target.controller";
import { DataTargetService } from "@services/data-target.service";
import { DataTarget } from "@entities/data-target.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataTargetType } from "../../src/entities/enum/data-target-type.enum";

describe("DataTarget Controller", () => {
    let controller: DataTargetController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DataTargetController],
            providers: [
                {
                    provide: DataTargetService,
                    useValue: {
                        findOne: jest.fn().mockResolvedValue([
                            {
                                type: DataTargetType.HttpPush,
                                name: "mocked",
                                application: {
                                    id: 1,
                                    name: "test",
                                    description: "test",
                                },
                            },
                        ]),
                    },
                },
            ],
        }).compile();

        controller = module.get<DataTargetController>(DataTargetController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
