import { BadRequestException, forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { User } from "@entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { Permission } from "@entities/permission.entity";
import { CreateUserDto } from "@dto/user-management/create-user.dto";
import { UpdateUserDto } from "@dto/user-management/update-user.dto";
import { ListAllUsersReponseDto } from "@dto/list-all-users-reponse.dto";
import { UserResponseDto } from "@dto/user-response.dto";
import { PermissionService } from "./permission.service";
import { ErrorCodes } from "@enum/error-codes.enum";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @Inject(forwardRef(() => PermissionService))
        private permissionService: PermissionService
    ) {}

    private readonly logger = new Logger(UserService.name, true);

    async isEmailUsedByAUser(email: string): Promise<boolean> {
        return (
            (await this.userRepository.count({
                email: email,
            })) > 0
        );
    }

    async findOneUserByEmailWithPassword(email: string): Promise<User> {
        return await this.userRepository.findOne(
            { email: email },
            {
                select: [
                    "id",
                    "name",
                    "email",
                    "active",
                    "passwordHash", // This is requiredsince passwordHash normally is hidden.
                    "lastLogin",
                ],
            }
        );
    }

    async findOne(id: number): Promise<User> {
        return await this.userRepository.findOne(id, {
            relations: ["permissions"],
        });
    }

    async findOneWithOrganizations(id: number): Promise<User> {
        return await this.userRepository.findOne(id, {
            relations: ["permissions", "permissions.organization"]
        })
    }

    async findUserPermissions(id: number): Promise<Permission[]> {
        return (
            await this.userRepository.findOne(id, {
                relations: ["permissions"],
            })
        ).permissions;
    }

    async updateLastLoginToNow(user: User): Promise<void> {
        await this.userRepository
            .createQueryBuilder()
            .update(User)
            .set({ lastLogin: new Date() })
            .where("id = :id", { id: user.id })
            .execute();
    }

    async createUser(dto: CreateUserDto): Promise<User> {
        const user = new User();
        const mappedUser = this.mapDtoToUser(user, dto);

        await this.setPasswordHash(mappedUser, dto.password);

        if (dto.globalAdmin) {
            const globalAdminPermission = await this.permissionService.findOrCreateGlobalAdminPermission();
            await this.permissionService.addUsersToPermission(
                globalAdminPermission,
                [mappedUser]
            );
        }

        return await this.userRepository.save(mappedUser);
    }

    private async setPasswordHash(mappedUser: User, password: string) {
        this.checkPassword(password);
        // Hash password with bcrpyt
        // this.logger.verbose("Generating salt");
        const salt = await bcrypt.genSalt(10);
        // this.logger.verbose("Generating hash");
        mappedUser.passwordHash = await bcrypt.hash(password, salt);
        // this.logger.verbose(`Generated hash: '${mappedUser.passwordHash}'`);
    }

    private checkPassword(password: string) {
        if (password.length < 6 ) {
            throw new BadRequestException(ErrorCodes.PasswordNotMetRequirements)
        }
    }

    private mapDtoToUser(user: User, dto: UpdateUserDto): User {
        user.name = dto.name;
        user.email = dto.email;
        user.permissions = [];
        user.active = dto.active;

        return user;
    }

    async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
        const user = await this.userRepository.findOne({ id: id });

        const mappedUser = this.mapDtoToUser(user, dto);
        if (dto.password != null && dto.password != undefined) {
            this.logger.log(
                `Changing password for user: id: ${mappedUser.id} - '${mappedUser.email}' ...`
            );
            await this.setPasswordHash(mappedUser, dto.password);
        }

        if (dto.globalAdmin) {
            const globalAdminPermission = await this.permissionService.findOrCreateGlobalAdminPermission();
            await this.permissionService.addUsersToPermission(
                globalAdminPermission,
                [mappedUser]
            );
        }

        return await this.userRepository.save(mappedUser);
    }

    async findManyUsersByIds(userIds: number[]): Promise<User[]> {
        return await this.userRepository.findByIds(userIds);
    }

    async findAll(): Promise<ListAllUsersReponseDto> {
        const [data, count] = await this.userRepository.findAndCount({
            relations: ["permissions"],
        });

        return {
            data: data.map(x => x as UserResponseDto),
            count: count,
        };
    }
}
