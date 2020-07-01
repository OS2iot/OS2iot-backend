import { Test, TestingModule } from "@nestjs/testing";
import { ApplicationController } from "./application.controller";
import { ApplicationService } from "./application.service";

describe("Application Controller", () => {
    let controller: ApplicationController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ApplicationController],
            providers: [
                {
                    provide: ApplicationService,
                    useValue: {
                        findAndCountWithPagination: jest
                            .fn()
                            .mockResolvedValue({
                                data: [],
                                count: 0,
                            }),
                    },
                },
            ],
        }).compile();

        controller = module.get<ApplicationController>(ApplicationController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    it("should expose findAll", () => {
        expect(controller.findAll).toBeDefined();
    });
});
