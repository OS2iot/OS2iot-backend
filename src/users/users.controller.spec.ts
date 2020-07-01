import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

describe("Users Controller", () => {
    let controller: UsersController;
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: {
                        findAll: jest
                            .fn()
                            .mockResolvedValue([
                                { firstName: "a", lastName: "b", age: 2 },
                            ]),
                    },
                },
            ],
        }).compile();

        service = await module.resolve(UsersService);
        controller = module.get<UsersController>(UsersController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    it("service should be defined", () => {
        expect(service).toBeDefined();
    });
});
