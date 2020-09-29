import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { AuthenticatedUser } from "@dto/internal/authenticated-user";
import { JwtPayloadDto } from "@entities/dto/internal/jwt-payload.dto";
import { PermissionService } from "@services/user-management/permission.service";
import { UserService } from "@services/user-management/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private permissionService: PermissionService,
        private userService: UserService,
        private configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("jwt.secret"),
        });
    }

    async validate(payload: JwtPayloadDto): Promise<AuthenticatedUser> {
        // Does the user still exist?
        const exists = await this.userService.exists(payload.sub);
        if (!exists) {
            throw new UnauthorizedException();
        }

        // This data is already validated
        const permissions = await this.permissionService.findPermissionGroupedByLevelForUser(
            payload.sub
        );

        return {
            userId: payload.sub,
            username: payload.username,
            permissions: permissions,
        };
    }
}
