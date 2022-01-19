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
import { Profile } from "passport-saml";
import { ListAllUsersMinimalResponseDto } from "@dto/list-all-users-minimal-response.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { CreateNewKombitUserDto } from "@dto/user-management/create-new-kombit-user.dto";

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
            loadRelationIds: {
                relations: ["createdBy", "updatedBy"],
            },
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

    async createUser(dto: CreateUserDto, userId: number): Promise<User> {
        const user = new User();
        const mappedUser = this.mapDtoToUser(user, dto);
        mappedUser.createdBy = userId;
        mappedUser.updatedBy = userId;

        await this.setPasswordHash(mappedUser, dto.password);

        if (dto.globalAdmin) {
            const globalAdminPermission = await this.permissionService.findOrCreateGlobalAdminPermission();
            await this.permissionService.addUsersToPermission(globalAdminPermission, [
                mappedUser,
            ]);
        }

        return await this.userRepository.save(mappedUser, { reload: true });
    }

    async createUserFromKombit(profile: Profile): Promise<User> {
        const user = new User();
        await this.mapKombitLoginProfileToUser(user, profile);

        return await this.userRepository.save(user);
    }

    private async mapKombitLoginProfileToUser(
        user: User,
        profile: Profile
    ): Promise<void> {
        user.active = true;
        user.nameId = profile.nameID;
        user.name = this.extractNameFromNameIDSAMLAttribute(profile.nameID);
        user.active = true;
    }

    private extractNameFromNameIDSAMLAttribute(nameId: string): string {
        return nameId
            ?.split(",")
            ?.find(x => x.startsWith("CN="))
            ?.split("=")
            ?.pop();
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
        if (user.nameId != null) {
            if (dto.name && user.name != dto.name) {
                throw new BadRequestException(ErrorCodes.CannotModifyOnKombitUser);
            }
            if (dto.email) {
                throw new BadRequestException(ErrorCodes.CannotModifyOnKombitUser);
            }
            if (dto.password) {
                throw new BadRequestException(ErrorCodes.CannotModifyOnKombitUser);
            }
        }

        user.name = dto.name;
        user.email = dto.email;
        user.permissions = user.permissions ? user.permissions : [];
        user.active = dto.active;

        return user;
    }

    async updateUser(id: number, dto: UpdateUserDto, userId: number): Promise<User> {
        const user = await this.userRepository.findOne(id, {
            relations: ["permissions"],
        });

        const mappedUser = this.mapDtoToUser(user, dto);
        mappedUser.updatedBy = userId;
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

    async updateEmail(dto: CreateNewKombitUserDto, user: UserResponseDto): Promise<User> {
        user.email = dto.email;
        return await this.userRepository.save(user);
    }

    async findManyUsersByIds(userIds: number[]): Promise<User[]> {
        return await this.userRepository.findByIds(userIds);
    }

    async findAll(query?: ListAllEntitiesDto): Promise<ListAllUsersResponseDto> {
        const sorting: { [id: string]: string | number } = {};
        if (
            query.orderOn != null &&
            (query.orderOn == "id" ||
                query.orderOn == "name" ||
                query.orderOn == "lastLogin")
        ) {
            sorting[query.orderOn] = query.sort.toLocaleUpperCase();
        } else {
            sorting["id"] = "ASC";
        }

        const [data, count] = await this.userRepository.findAndCount({
            relations: ["permissions"],
            take: +query.limit,
            skip: +query.offset,
            order: sorting,
        });

        return {
            data: data.map(x => x as UserResponseDto),
            count: count,
        };
    }

    async getUsersOnPermissionId(
        permissionId: number,
        query: ListAllEntitiesDto
    ): Promise<ListAllUsersResponseDto> {
        const [data, count] = await this.userRepository
            .createQueryBuilder("user")
            .innerJoin("user.permissions", "p")
            .where('"p"."id" = :permissionId', { permissionId: permissionId })
            .take(+query.limit)
            .skip(+query.offset)
            .getManyAndCount();

        return {
            data: data.map(x => x as UserResponseDto),
            count: count,
        };
    }

    async findAllMinimal(): Promise<ListAllUsersMinimalResponseDto> {
        const result = await this.userRepository.find({
            select: ["id", "name"],
            order: { id: "ASC" },
        });
        return {
            users: result,
        };
    }
}
