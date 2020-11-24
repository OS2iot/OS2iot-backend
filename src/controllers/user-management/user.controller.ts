import {
    BadRequestException,
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    NotFoundException,
    Param,
    ParseBoolPipe,
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
import { OrganizationAdmin, Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { CreateUserDto } from "@dto/user-management/create-user.dto";
import { UpdateUserDto } from "@dto/user-management/update-user.dto";
import { UserResponseDto } from "@dto/user-response.dto";
import { ErrorCodes } from "@entities/enum/error-codes.enum";
import { checkIfUserIsGlobalAdmin } from "@helpers/security-helper";
import { UserService } from "@services/user-management/user.service";
import { ListAllUsersResponseDto } from "@dto/list-all-users-response.dto";
import { ListAllUsersMinimalResponseDto } from "@dto/list-all-users-minimal-response.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@OrganizationAdmin()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@ApiTags("User Management")
@Controller("user")
export class UserController {
    constructor(private userService: UserService) {}

    private readonly logger = new Logger(UserController.name);

    @Get("minimal")
    @ApiOperation({ summary: "Get all id,names of users" })
    @Read()
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

            return user;
        } catch (err) {
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

    @Put(":id")
    @ApiOperation({ summary: "Change a user" })
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() dto: UpdateUserDto
    ): Promise<UserResponseDto> {
        if (dto.globalAdmin) {
            checkIfUserIsGlobalAdmin(req);
        }
        // Don't leak the passwordHash
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = await this.userService.updateUser(
            id,
            dto,
            req.user.userId
        );

        return user;
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...user } = await this.userService.findOne(
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
    async findAll(): Promise<ListAllUsersResponseDto> {
        return await this.userService.findAll();
    }
}
