import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { jwtConstants } from "./constants";
import { AuthenticatedUser } from "./authenticated-user";
import { PermissionService } from "../permission/permission.service";
import { JwtPayloadDto } from "./jwt-payload.dto";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private permissionService: PermissionService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: JwtPayloadDto): Promise<AuthenticatedUser> {
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
