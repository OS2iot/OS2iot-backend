import { User } from '../entity/User.entity';
import { getManager } from "typeorm";


export default class UserService {

    public async fetchUserById(id: number) {
        // TODO: Should this be instantiated for the class and not every time it's used?
        const repository = getManager().getRepository(User);

        const result = await repository.findOneOrFail(id)

        return result
    }
}