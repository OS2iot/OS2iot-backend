import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { jwtConstants } from "./constants";
import { PermissionService } from "@services/user-management/permission.service";
import { JwtPayloadDto } from "@entities/dto/internal/jwt-payload.dto";
import { AuthenticatedUser } from "@dto/internal/authenticated-user";
import { UserService } from "../services/user-management/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private permissionService: PermissionService,
        private userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: JwtPayloadDto): Promise<AuthenticatedUser> {
        // Does the user still exist?
        const user = await this.userService.findOne(payload.sub);
        if (!user) {
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