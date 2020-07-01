import { Test, TestingModule } from "@nestjs/testing";
import { ApplicationService } from "@services/application.service";
import { Application } from "@entities/applikation.entity";
import { getRepositoryToken } from "@nestjs/typeorm";

describe("ApplicationService", () => {
    let service: ApplicationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApplicationService,
                {
                    provide: getRepositoryToken(Application),
                    useValue: {
                        find: jest
                            .fn()
                            .mockResolvedValue([
                                { firstName: "a", lastName: "b", age: 2 },
                            ]),
                    },
                },
            ],
        }).compile();

        service = module.get<ApplicationService>(ApplicationService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
