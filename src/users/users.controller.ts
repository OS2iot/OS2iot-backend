import { Controller, Get, Post, Body } from "@nestjs/common";
import { User } from "src/entity/User.entity";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import {
    ApiBody,
    ApiProduces,
    ApiResponse,
    ApiCreatedResponse,
} from "@nestjs/swagger";

@Controller("users")
export class UsersController {
    constructor(private usersService: UsersService) {}

    @Get()
    @ApiResponse({ type: [User] })
    @ApiProduces("application/json")
    findAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    @Post()
    @ApiBody({ type: [CreateUserDto] })
    @ApiCreatedResponse({
        description: "The record has been successfully created.",
        type: User,
    })
    createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.usersService.createUser(createUserDto);
    }
}
