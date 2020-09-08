import {
    Controller,
    Post,
    Body,
    BadRequestException,
    InternalServerErrorException,
} from "@nestjs/common";
import { CreateUserDto } from "./create-user.dto";
import { UserService } from "./user.service";
import { ApiOperation } from "@nestjs/swagger";
import { User } from "@entities/user.entity";
import { UserResponseDto } from "@dto/user-response.dto";
import { QueryFailedError } from "typeorm";
import { Logger } from "@nestjs/common";
import { ErrorCodes } from "../entities/enum/error-codes.enum";

@Controller("user")
export class UserController {
    constructor(private userService: UserService) {}

    private readonly logger = new Logger(UserController.name);

    @Post()
    @ApiOperation({ summary: "Create a new User" })
    async create(
        @Body() createUserDto: CreateUserDto
    ): Promise<UserResponseDto> {
        try {
            // Don't leak the passwordHash
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
}
