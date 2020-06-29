import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/entity/User.entity";
import { UsersService } from "src/users/users.service";
import { UsersController } from "src/users/users.controller";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    exports: [TypeOrmModule],
    providers: [UsersService],
    controllers: [UsersController],
})
export class UsersModule {}
