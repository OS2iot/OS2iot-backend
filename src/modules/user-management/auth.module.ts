import { Module, forwardRef, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { JwtStrategy } from "@auth/jwt.strategy";
import { LocalStrategy } from "@auth/local.strategy";
import configuration from "@config/configuration";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { PermissionModule } from "@modules/user-management/permission.module";
import { UserModule } from "@modules/user-management/user.module";
import { AuthService } from "@services/user-management/auth.service";
import { AuthController } from "@user-management-controller/auth.controller";
import { KombitStrategy } from "@auth/kombit.strategy";
import { HandleRedirectUrlParameterMiddleware } from "@auth/handle-redirect-url-parameter.middleware";

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
    providers: [AuthService, LocalStrategy, JwtStrategy, KombitStrategy],
    exports: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(HandleRedirectUrlParameterMiddleware)
            .forRoutes("auth/kombit/login");
    }
}
