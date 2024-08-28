import { AuthenticatedUser } from "@dto/internal/authenticated-user";
import { JwtPayloadDto } from "@entities/dto/internal/jwt-payload.dto";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { PermissionService } from "@services/user-management/permission.service";
import { UserService } from "@services/user-management/user.service";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtStrategyName } from "./constants";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JwtStrategyName) {
    constructor(
        private permissionService: PermissionService,
        private userService: UserService,
        private configService: ConfigService
    ) {
        super({
            // Configure the strategy to look for the JWT token in the Authorization header
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                ExtractJwt.fromUrlQueryParameter("secret_token"),
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("jwt.secret"),
        });
    }
    private readonly logger = new Logger(JwtStrategy.name);

    private readonly NAME_ID_FORMAT = "urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName";

    async validate(payload: JwtPayloadDto): Promise<AuthenticatedUser> {
        // Does the user still exist?
        const exists = await this.userService.findOne(payload.sub);
        if (!exists) {
            this.logger.warn(`Authorization for user with id: ${payload.sub} failed, since they no longer exists`);
            throw new UnauthorizedException();
        }

        const result: AuthenticatedUser = {
            userId: payload.sub,
            username: payload.username,
        };

        if (exists.nameId) {
            // Add SAML stuff
            result.nameID = exists.nameId;
            result.nameIDFormat = this.NAME_ID_FORMAT;
        }
        // This data is already validated
        result.permissions = await this.permissionService.findPermissionGroupedByLevelForUser(payload.sub);

        return result;
    }
}
