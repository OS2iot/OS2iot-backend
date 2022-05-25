import {
    BadRequestException,
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import { Logger } from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { QueryFailedError } from "typeorm";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read, UserAdmin } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { CreateUserDto } from "@dto/user-management/create-user.dto";
import { UpdateUserDto } from "@dto/user-management/update-user.dto";
import { UserResponseDto } from "@dto/user-response.dto";
import { ErrorCodes } from "@entities/enum/error-codes.enum";
import { checkIfUserIsGlobalAdmin, checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { UserService } from "@services/user-management/user.service";
import { ListAllUsersResponseDto } from "@dto/list-all-users-response.dto";
import { ListAllUsersMinimalResponseDto } from "@dto/list-all-users-minimal-response.dto";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { User } from "@entities/user.entity";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { OrganizationService } from "@services/user-management/organization.service";
import { Organization } from "@entities/organization.entity";
import { RejectUserDto } from "@dto/user-management/reject-user.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@UserAdmin()
@ApiBearerAuth()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@ApiTags("User Management")
@Controller("user")
export class UserController {
    constructor(
        private userService: UserService,
        private organizationService: OrganizationService
    ) {}

    private readonly logger = new Logger(UserController.name);

    @Get("minimal")
    @ApiOperation({ summary: "Get all id,names of users" })
    async findAllMinimal(): Promise<ListAllUsersMinimalResponseDto> {
        return await this.userService.findAllMinimal();
    }

    @Post()
    @ApiOperation({ summary: "Create a new User" })
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createUserDto: CreateUserDto
    ): Promise<UserResponseDto> {
        if (createUserDto.globalAdmin) {
            checkIfUserIsGlobalAdmin(req);
        }
        try {
            // Don't leak the passwordHash
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...user } = await this.userService.createUser(
                createUserDto,
                req.user.userId
            );
            AuditLog.success(
                ActionType.CREATE,
                User.name,
                req.user.userId,
                user.id,
                user.name
            );

            return user;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, User.name, req.user.userId);
            if (
                err instanceof QueryFailedError &&
                err.message.startsWith("duplicate key value violates unique constraint")
            ) {
                throw new BadRequestException(ErrorCodes.UserAlreadyExists);
            }

            this.logger.error(err);
            throw new InternalServerErrorException();
        }
    }

    @Put("/rejectUser")
    @ApiOperation({ summary: "Rejects user and removes from awaiting users" })
    async rejectUser(
        @Req() req: AuthenticatedRequest,
        @Body() body: RejectUserDto
    ): Promise<Organization> {
        checkIfUserHasAccessToOrganization(req, body.orgId, OrganizationAccessScope.UserAdministrationWrite);

        const user = await this.userService.findOne(body.userIdToReject);
        const organization = await this.organizationService.findByIdWithUsers(body.orgId);

        return await this.organizationService.rejectAwaitingUser(user, organization);
    }

    @Put(":id")
    @ApiOperation({ summary: "Change a user" })
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() dto: UpdateUserDto
    ): Promise<UserResponseDto> {
        try {
            if (dto.globalAdmin) {
                checkIfUserIsGlobalAdmin(req);
            }
            // Don't leak the passwordHash
            const { passwordHash: _, ...user } = await this.userService.updateUser(
                id,
                dto,
                req.user.userId
            );
            AuditLog.success(
                ActionType.UPDATE,
                User.name,
                req.user.userId,
                user.id,
                user.name
            );

            return user;
        } catch (err) {
            AuditLog.fail(ActionType.UPDATE, User.name, req.user.userId, id);
            throw err;
        }
    }

    @Put(":id/hide-welcome")
    @ApiOperation({ summary: "Don't show welcome screen for a user again" })
    @Read()
    async hideWelcome(@Req() req: AuthenticatedRequest): Promise<boolean> {
        const wasOk = await this.userService.hideWelcome(req.user.userId);

        AuditLog.success(
            ActionType.UPDATE,
            User.name,
            req.user.userId,
            req.user.userId,
            req.user.username
        );

        return wasOk
    }

    @Get(":id")
    @ApiOperation({ summary: "Get one user" })
    async find(
        @Param("id", new ParseIntPipe()) id: number,
        @Query("extendedInfo") extendedInfo?: boolean
    ): Promise<UserResponseDto> {
        const getExtendedInfo = extendedInfo != null ? extendedInfo : false;
        try {
            // Don't leak the passwordHash
            const { passwordHash: _, ...user } = await this.userService.findOne(
                id,
                getExtendedInfo,
                getExtendedInfo
            );

            return user;
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    @Get()
    @ApiOperation({ summary: "Get all users" })
    async findAll(@Query() query?: ListAllEntitiesDto): Promise<ListAllUsersResponseDto> {
        return await this.userService.findAll(query);
    }

    @Get("/awaitingUsers/:id")
    @ApiOperation({ summary: "Get awaiting users" })
    async findAwaitingUsers(
        @Param("id", new ParseIntPipe()) organizationId: number,
        @Query() query?: ListAllEntitiesDto
    ): Promise<ListAllUsersResponseDto> {
        try {
            return await this.userService.getAwaitingUsers(organizationId, query);
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }
}
