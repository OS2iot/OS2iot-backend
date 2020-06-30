import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { UsersController } from "./users/users.controller";
import { UsersService } from "./users/users.service";
import { UsersModule } from "./users/users.module";
import { ApplicationModule } from "./application/application.module";
import { ApplicationController } from "./application/application.controller";
import { ApplicationService } from "./application/application.service";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "postgres",
            host: "host.docker.internal",
            port: 5433,
            username: "os2iot",
            password: "toi2so",
            database: "os2iot",
            synchronize: true,
            logging: true,
            autoLoadEntities: true,
        }),
        UsersModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ApplicationModule,
    ],
    controllers: [AppController, UsersController, ApplicationController],
    providers: [AppService, UsersService, ApplicationService],
})
export class AppModule {
    constructor(private connection: Connection) {}
}
