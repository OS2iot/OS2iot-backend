import { Repository, EntityRepository } from "typeorm";
import { User } from "../entity/user.entity";

@EntityRepository(User)
export class UsersRepository extends Repository<User> {

}