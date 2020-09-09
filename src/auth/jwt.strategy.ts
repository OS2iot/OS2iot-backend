import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, Logger } from "@nestjs/common";
import { jwtConstants } from "./constants";
import { UserService } from "../user/user.service";
import { AuthenticatedUser } from "./authenticated-user";
import { PermissionService } from "../permission/permission.service";
import { OrganizationPermission } from "../entities/organizion-permission.entity";
import { SUBSCRIBER_COMBINED_REF_MAP } from "../services/kafka/kafka.decorator";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private permissionService: PermissionService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: any): Promise<AuthenticatedUser> {
        // This data is already validated
        const permissions = await this.permissionService.findPermissionsForUser(
            payload.sub
        );
        const permissions2 = await this.permissionService.findPermissionGroupedByLevelForUser(
            payload.sub
        );

        Logger.log(JSON.stringify(permissions2));

        return {
            userId: payload.sub,
            username: payload.username,
            permissions: permissions2,
        };
    }
}
