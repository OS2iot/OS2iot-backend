import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";
import { Connection } from "typeorm";

describe("Users Service", () => {
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: UsersRepository,
                    useValue: {
                        find: jest
                            .fn()
                            .mockResolvedValue([
                                { firstName: "a", lastName: "b", age: 2 },
                            ]),
                    },
                },
                {
                    provide: Connection,
                    useValue: {
                        transaction: jest.fn().mockImplementation(() => true),
                    },
                },
            ],
        }).compile();

        service = await module.get<UsersService>(UsersService);
    });

    it("service should be defined", () => {
        expect(service).toBeDefined();
    });
});
