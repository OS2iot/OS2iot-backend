import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { DataTarget } from "@entities/data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { ApplicationService } from "@services/device-management/application.service";

describe("DataTargetService", () => {
    let service: DataTargetService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DataTargetService,
                {
                    provide: getRepositoryToken(DataTarget),
                    useValue: {
                        findOneOrFail: jest.fn().mockResolvedValue([
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
                {
                    provide: ApplicationService,
                    useValue: {},
                },
            ],
        }).compile();
        moduleFixture.useLogger(false);

        service = module.get<DataTargetService>(DataTargetService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
