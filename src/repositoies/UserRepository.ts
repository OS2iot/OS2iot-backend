import { EntityRepository, Repository } from "typeorm";
import { User } from "../entity/User.entity";

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    // We could just call findOneOrFail from the controller ...
    findById(id: number): Promise<User> {
        return this.findOneOrFail(id)
    }

    // This doesn't need to be here, we could just call .find() from the controller.
    findAll(): Promise<User[]> {
        return this.find()
    }
}
