import { User } from "../entity/user.entity";
import {
    getConnection,
    createConnection,
    Repository,
    getCustomRepository,
} from "typeorm";
import { UsersRepository } from "./users.repository";

describe("UsersRepositoryTests", () => {
    let repository: Repository<User>;
    const testConnectionName = "sqlite-inmemory";

    beforeEach(async () => {
        const connection = await createConnection({
            type: "sqlite",
            database: ":memory:",
            dropSchema: true,
            entities: [User],
            synchronize: true,
            logging: false,
            name: testConnectionName,
        });

        repository = getCustomRepository(UsersRepository, testConnectionName);

        return connection;
    });

    afterEach(() => {
        const conn = getConnection(testConnectionName);
        return conn.close();
    });

    it("should be defined", () => {
        expect(repository).toBeDefined();
    });

    test("should store and fetch user", async () => {
        await repository.insert({
            firstName: "Test",
            lastName: "Testersen",
            age: 12,
        });

        const testTestersen = await repository.find({
            where: {
                id: 1,
            },
        });
        expect(testTestersen[0].firstName).toBe("Test");
        expect(testTestersen[0].lastName).toBe("Testersen");
    });
});
