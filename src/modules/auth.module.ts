import { Module } from "@nestjs/common";
import { UserModule } from "./user.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "@auth/constants";
import { PermissionModule } from "./permission.module";
import { AuthService } from "@services/user-management/auth.service";
import { LocalStrategy } from "@auth/local.strategy";
import { JwtStrategy } from "@auth/jwt.strategy";
import { AuthController } from "@user-management-controller/auth.controller";

@Module({
    imports: [
        UserModule,
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: "9h" }, // TODO: Make this configurable?
        }),
        PermissionModule,
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
