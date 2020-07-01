import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entity/user.entity";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UsersRepository } from "./users.repository";

@Module({
    imports: [TypeOrmModule.forFeature([User, UsersRepository])],
    exports: [TypeOrmModule],
    providers: [UsersService],
    controllers: [UsersController],
})
export class UsersModule {}
