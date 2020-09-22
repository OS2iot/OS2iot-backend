import {
    Controller,
    Post,
    Body,
    BadRequestException,
    InternalServerErrorException,
    UseGuards,
    Get,
    Put,
    Param,
    NotFoundException,
    ParseIntPipe,
    Req,
} from "@nestjs/common";
import { UserService } from "@services/user-management/user.service";
import {
    ApiOperation,
    ApiTags,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { UserResponseDto } from "@dto/user-response.dto";
import { QueryFailedError } from "typeorm";
import { Logger } from "@nestjs/common";
import { ErrorCodes } from "@entities/enum/error-codes.enum";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { RolesGuard } from "@auth/roles.guard";
import { OrganizationAdmin } from "@auth/roles.decorator";
import { CreateUserDto } from "@dto/user-management/create-user.dto";
import { UpdateUserDto } from "@dto/user-management/update-user.dto";
import { ListAllUsersReponseDto } from "@dto/list-all-users-reponse.dto";
import { checkIfUserIsGlobalAdmin } from "@helpers/security-helper";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";

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
                createUserDto
            );

            return user;
        } catch (err) {
            if (
                err instanceof QueryFailedError &&
                err.message.startsWith(
                    "duplicate key value violates unique constraint"
                )
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
            dto
        );

        return user;
    }

    @Get(":id")
    @ApiOperation({ summary: "Get one user" })
    async find(
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<UserResponseDto> {
        try {
            // Don't leak the passwordHash
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...user } = await this.userService.findOne(
                id
            );

            return user;
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    @Get()
    @ApiOperation({ summary: "Get all users" })
    async findAll(): Promise<ListAllUsersReponseDto> {
        return await this.userService.findAll();
    }
}
