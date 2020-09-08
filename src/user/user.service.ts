import { Injectable, Logger } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "./create-user.dto";
import * as bcrypt from "bcryptjs";
import { Permission } from "@entities/permission.entity";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) {}

    private readonly logger = new Logger(UserService.name, true);

    async findOneUserByEmail(email: string): Promise<User> {
        return this.userRepository.findOne({ email: email });
    }

    async findUserPermissions(id: number): Promise<Permission[]> {
        return (
            await this.userRepository.findOne(id, {
                relations: ["permissions"],
            })
        ).permissions;
    }

    async createUser(dto: CreateUserDto): Promise<User> {
        const user = new User();
        user.name = dto.name;
        user.email = dto.email;
        user.permissions = [];

        // Hash password with bcrpyt
        this.logger.verbose("Generating salt");
        const salt = await bcrypt.genSalt(10);
        this.logger.verbose("Generating hash");
        user.passwordHash = await bcrypt.hash(dto.password, salt);
        this.logger.verbose(`Generated hash: '${user.passwordHash}'`);

        return await this.userRepository.save(user);
    }
}
