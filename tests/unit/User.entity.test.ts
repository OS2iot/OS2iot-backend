import { User } from "../../src/entity/User.entity";
import "reflect-metadata";

test("toString on user", () => {
    const user = new User();
    user.id = 1;
    user.firstName = "Test";
    user.lastName = "Testersen";
    user.age = 42;
    expect(user.toString()).toBe(
        "User: id: 1 - firstName: Test - lastName: Testersen - age: 42"
    );
});
