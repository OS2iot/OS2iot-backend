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
import { ApiKeyStrategy } from "@auth/api-key.strategy";
import { ApiKeyModule } from "@modules/api-key-management/api-key.module";

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
          // The expected "StringValue" type is not exported
          expiresIn: configService.get<any>("jwt.expiresIn"),
        },
      }),
    }),
    forwardRef(() => UserModule),
    forwardRef(() => PermissionModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => ApiKeyModule),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, KombitStrategy, ApiKeyStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HandleRedirectUrlParameterMiddleware).forRoutes("auth/kombit/login");
  }
}
