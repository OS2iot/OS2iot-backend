import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";

import { CreateUserDto } from "@dto/user-management/create-user.dto";
import { UpdateUserDto } from "@dto/user-management/update-user.dto";
import { UserResponseDto } from "@dto/user-response.dto";
import { Permission } from "@entities/permission.entity";
import { User } from "@entities/user.entity";
import { ErrorCodes } from "@enum/error-codes.enum";

import { PermissionService } from "./permission.service";
import { ListAllUsersResponseDto } from "@dto/list-all-users-response.dto";
import { KombitLoginProfileDto } from "@auth/kombit-login-profile.dto";

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

    async findOne(
        id: number,
        getPermissionOrganisationInfo = false,
        getPermissionUsersInfo = false
    ): Promise<User> {
        const relations = ["permissions"];
        if (getPermissionOrganisationInfo) {
            relations.push("permissions.organization");
        }
        if (getPermissionUsersInfo) {
            relations.push("permissions.users");
        }

        return await this.userRepository.findOne(id, {
            relations: relations,
        });
    }

    async exists(id: number): Promise<boolean> {
        return (
            (await this.userRepository.count({
                where: {
                    id: id,
                },
            })) > 0
        );
    }

    async findOneWithOrganizations(id: number): Promise<User> {
        return await this.userRepository.findOne(id, {
            relations: ["permissions", "permissions.organization"],
        });
    }

    async findOneByNameId(nameId: string): Promise<User> {
        return await this.userRepository.findOne({
            nameId: nameId,
        });
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
            await this.permissionService.addUsersToPermission(globalAdminPermission, [
                mappedUser,
            ]);
        }

        return await this.userRepository.save(mappedUser, { reload: true });
    }

    async createUserFromKombit(profile: KombitLoginProfileDto): Promise<User> {
        const user = new User();
        await this.mapKombitLoginProfileToUser(user, profile);

        return user;
    }

    async mapKombitLoginProfileToUser(
        user: User,
        profile: KombitLoginProfileDto
    ): Promise<void> {
        user.active = true;
        user.name = profile.nameID;
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
        if (password.length < 6) {
            throw new BadRequestException(ErrorCodes.PasswordNotMetRequirements);
        }
    }

    private mapDtoToUser(user: User, dto: UpdateUserDto): User {
        user.name = dto.name;
        user.email = dto.email;
        user.permissions = user.permissions ? user.permissions : [];
        user.active = dto.active;

        return user;
    }

    async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
        const user = await this.userRepository.findOne(id, {
            relations: ["permissions"],
        });

        const mappedUser = this.mapDtoToUser(user, dto);
        if (dto.password != null && dto.password != undefined) {
            this.logger.log(
                `Changing password for user: id: ${mappedUser.id} - '${mappedUser.email}' ...`
            );
            await this.setPasswordHash(mappedUser, dto.password);
        }

        await this.updateGlobalAdminStatusIfNeeded(dto, mappedUser);

        return await this.userRepository.save(mappedUser);
    }

    private async updateGlobalAdminStatusIfNeeded(dto: UpdateUserDto, mappedUser: User) {
        if (dto.globalAdmin) {
            const globalAdminPermission = await this.permissionService.findOrCreateGlobalAdminPermission();
            // Don't do anything if the user already is global admin.
            if (!mappedUser.permissions.some(x => x.id == globalAdminPermission.id)) {
                await this.permissionService.addUsersToPermission(globalAdminPermission, [
                    mappedUser,
                ]);
            }
        } else {
            const globalAdminPermission = await this.permissionService.findOrCreateGlobalAdminPermission();
            await this.permissionService.removeUserFromPermission(
                globalAdminPermission,
                mappedUser
            );
        }
    }

    async findManyUsersByIds(userIds: number[]): Promise<User[]> {
        return await this.userRepository.findByIds(userIds);
    }

    async findAll(): Promise<ListAllUsersResponseDto> {
        const [data, count] = await this.userRepository.findAndCount({
            relations: ["permissions"],
        });

        return {
            data: data.map(x => x as UserResponseDto),
            count: count,
        };
    }
}
