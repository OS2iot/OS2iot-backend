import { forwardRef, Module } from "@nestjs/common";
import { UserModule } from "@modules/user-management/user.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { PermissionModule } from "@modules/user-management/permission.module";
import { AuthService } from "@services/user-management/auth.service";
import { LocalStrategy } from "@auth/local.strategy";
import { JwtStrategy } from "@auth/jwt.strategy";
import { AuthController } from "@user-management-controller/auth.controller";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "@config/configuration";
import { OrganizationModule } from "@modules/user-management/organization.module";

@Module({
    imports: [
        ConfigModule.forRoot({ load: [configuration] }),
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>("jwt.secret"),
                signOptions: {
                    expiresIn: configService.get<string>("jwt.expiresIn"),
                },
            }),
        }),
        forwardRef(() => UserModule),
        forwardRef(() => PermissionModule),
        forwardRef(() => OrganizationModule),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
