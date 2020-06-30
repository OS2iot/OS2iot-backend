import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { User } from "../entity/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
    constructor(
        private usersRepository: UsersRepository,
        private connection: Connection
    ) {}

    findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async createMany(users: User[]): Promise<void> {
        await this.connection.transaction(async (manager) => {
            await manager.save(users[0]);
            await manager.save(users[1]);
        });
    }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const user = new User();
        user.firstName = createUserDto.firstName;
        user.lastName = createUserDto.lastName;
        user.age = createUserDto.age;

        return this.usersRepository.save(user);
    }
}
