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
import { Permission } from "@entities/permissions/permission.entity";
import { User } from "@entities/user.entity";
import { ErrorCodes } from "@enum/error-codes.enum";

import { PermissionService } from "./permission.service";
import { ListAllUsersResponseDto } from "@dto/list-all-users-response.dto";
import { Profile } from "passport-saml";
import { ListAllUsersMinimalResponseDto } from "@dto/list-all-users-minimal-response.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { CreateNewKombitUserDto } from "@dto/user-management/create-new-kombit-user.dto";
import * as nodemailer from "nodemailer";
import { Organization } from "@entities/organization.entity";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { PermissionType } from "@enum/permission-type.enum";
import { ConfigService } from "@nestjs/config";
import { isPermissionType } from "@helpers/security-helper";
import { nameof } from "@helpers/type-helper";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @Inject(forwardRef(() => PermissionService))
        private permissionService: PermissionService,
        private configService: ConfigService
    ) {}

    private readonly logger = new Logger(UserService.name, true);

    async isEmailUsedByAUser(email: string): Promise<boolean> {
        return (
            (await this.userRepository.count({
                email: email,
            })) > 0
        );
    }

    async acceptUser(
        user: User,
        org: Organization,
        newUserPermissions: Permission[]
    ): Promise<User> {
        user.awaitingConfirmation = false;

        if (
            user.permissions.find(perms =>
                newUserPermissions.some(newPerm => newPerm.id === perms.id)
            )
        ) {
            throw new BadRequestException(ErrorCodes.UserAlreadyInPermission);
        } else {
            const index = user.requestedOrganizations.findIndex(
                dbOrg => dbOrg.id === org.id
            );
            user.requestedOrganizations.splice(index, 1);
            user.permissions.push(...newUserPermissions);
            await this.sendVerificationMail(user, org);
            return await this.userRepository.save(user);
        }
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
        const relations = ["permissions", "requestedOrganizations"];
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
            relations: ["permissions", "permissions.organization", "permissions.type"],
            loadRelationIds: {
                relations: [`permissions.${nameof<Permission>("applicationIds")}`],
            },
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
        mappedUser.showWelcomeScreen = true;

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
        user.showWelcomeScreen = true;

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

    async newKombitUser(
        dto: CreateNewKombitUserDto,
        requestedOrganizations: Organization[],
        user: User
    ): Promise<User> {
        user.email = dto.email;
        user.awaitingConfirmation = true;
        for (let index = 0; index < requestedOrganizations.length; index++) {
            await this.sendOrganizationRequestMail(user, requestedOrganizations[index]);
        }
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
            relations: ["permissions", "permissions.type"],
            take: +query.limit,
            skip: +query.offset,
            order: sorting,
            where: {
                isSystemUser: false,
            },
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

    async getUsersOnOrganization(
        organizationId: number,
        query: ListAllEntitiesDto
    ): Promise<ListAllUsersResponseDto> {
        let orderBy = `user.id`;
        if (
            query.orderOn !== null &&
            (query.orderOn === "id" || query.orderOn === "name")
        ) {
            orderBy = `user.${query.orderOn}`;
        }
        const order: "DESC" | "ASC" =
            query?.sort?.toLocaleUpperCase() == "DESC" ? "DESC" : "ASC";
        
        const [data, count] = await this.userRepository
            .createQueryBuilder("user")
            .innerJoin("user.permissions", "p")
            .where('"p"."organizationId" = :organizationId', { organizationId: organizationId })
            .take(+query.limit)
            .skip(+query.offset)
            .orderBy(orderBy, order)
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

    basicMailTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
        return nodemailer.createTransport({
            host: this.configService.get<string>("email.host"),
            port: this.configService.get<number>("email.port"),
            auth: {
                user: this.configService.get<string>("email.user"),
                pass: this.configService.get<string>("email.pass"),
            },
        });
    }

    async sendOrganizationRequestMail(
        user: User,
        organization: Organization
    ): Promise<void> {
        const emails = await this.getOrgAdminEmails(organization);
        const transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> = this.basicMailTransporter();
        try {
            await transporter.verify();
        } catch (error) {
            throw new BadRequestException(ErrorCodes.SendMailError);
        }
        try {
            await transporter.sendMail({
                from: this.configService.get<string>("email.from"),
                to: emails,
                subject: "Ny ansøgning til din organisation i OS2iot",
                html: `<p>Ny ansøgning til din organisation i OS2iot</p>
                <p><a href="${this.configService.get<string>(
                    "frontend.baseurl"
                )}/admin/users">Klik her</a> for at bekræfte eller afvise brugeren ${
                    user.name
                } i organisationen ${organization.name}
                </p>
                <p>Find brugeren under fanebladet "Afventende brugere"</p>`, // html body
            });
        } catch (error) {
            throw new BadRequestException(ErrorCodes.SendMailError);
        }
    }

    async sendRejectionMail(user: User, organization: Organization): Promise<void> {
        const transporter = this.basicMailTransporter();

        try {
            await transporter.verify();
        } catch (error) {
            throw new BadRequestException(ErrorCodes.SendMailError);
        }
        try {
            await transporter.sendMail({
                from: this.configService.get<string>("email.from"), // sender address
                to: user.email, // list of receivers
                subject: "Ansøgning i OS2iot afvist", // Subject line
                html: `<h1>Din ansøgning om tilknytning til organisationen ${organization.name} i OS2iot er afvist. Kontakt din OS2iot-administrator, hvis du vil vide mere.</h1>`, // html body
            });
        } catch (error) {
            throw new BadRequestException(ErrorCodes.SendMailError);
        }
    }

    async sendVerificationMail(user: User, organization: Organization): Promise<void> {
        const transporter = this.basicMailTransporter();

        try {
            await transporter.verify();
        } catch (error) {
            throw new BadRequestException(ErrorCodes.SendMailError);
        }
        try {
            await transporter.sendMail({
                from: this.configService.get<string>("email.from"), // sender address
                to: user.email, // list of receivers
                subject: "Ansøgning i OS2iot godkendt", // Subject line
                html: `<h1>Din ansøgning om tilknytning til organisationen ${organization.name} i OS2iot er godkendt</h1>`, // html body
            });
        } catch (error) {
            throw new BadRequestException(ErrorCodes.SendMailError);
        }
    }

    async getOrgAdminEmails(organization: Organization): Promise<string[]> {
        const emails: string[] = [];
        const globalAdminPermission: Permission = await this.permissionService.getGlobalPermission();
        organization.permissions.forEach(permission => {
            if (isPermissionType(permission, PermissionType.OrganizationUserAdmin)) {
                if (permission.users.length > 0) {
                    permission.users.forEach(user => {
                        emails.push(user.email);
                    });
                } else {
                    globalAdminPermission.users.forEach(user => {
                        emails.push(user.email);
                    });
                }
            }
        });
        return emails;
    }

    async getAwaitingUsers(
        query?: ListAllEntitiesDto,
        organizationIds?: number[]
    ): Promise<ListAllUsersResponseDto> {
        let orderBy = `user.id`;
        if (
            query.orderOn !== null &&
            (query.orderOn === "id" || query.orderOn === "name")
        ) {
            orderBy = `user.${query.orderOn}`;
        }
        const order: "DESC" | "ASC" =
            query?.sort?.toLocaleUpperCase() == "DESC" ? "DESC" : "ASC";

        let usersQuery = this.userRepository
            .createQueryBuilder("user")
            .innerJoin("user.requestedOrganizations", "org")
            .addSelect("org.id")
            .take(+query.limit)
            .skip(+query.offset)
            .orderBy(orderBy, order);

        if (organizationIds?.length) {
            usersQuery = usersQuery.where("org.id IN (:...organizationIds)", {
                organizationIds,
            });
        }

        const [data, count] = await usersQuery.getManyAndCount();

        return {
            data: data.map(x => x as UserResponseDto),
            count: count,
        };
    }

    async hideWelcome(id: number): Promise<boolean> {
        const res = await this.userRepository.update(id, { showWelcomeScreen: false });
        return !!res.affected;
    }
}
