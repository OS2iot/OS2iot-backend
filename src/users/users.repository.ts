import { Repository, EntityRepository } from "typeorm";
import { User } from "../entity/User.entity";

@EntityRepository(User)
export class UsersRepository extends Repository<User> {

}