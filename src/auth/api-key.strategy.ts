import { AuthenticatedApiKey } from "@dto/internal/authenticated-api-key";
import { ErrorCodes } from "@enum/error-codes.enum";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "@services/user-management/auth.service";
import { PermissionService } from "@services/user-management/permission.service";
import { HeaderAPIKeyStrategy } from "passport-headerapikey";
import { ApiKeyHeader, ApiKeyStrategyName, HeaderApiVerifiedCallback } from "./constants";

const passReqToCallback = false;

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
    HeaderAPIKeyStrategy,
    ApiKeyStrategyName
) {
    constructor(
        private authService: AuthService,
        private permissionService: PermissionService
    ) {
        super(
            {
                header: ApiKeyHeader,
                prefix: "",
            },
            passReqToCallback
        );
    }

    async validate(
        apiKey: string,
        _done: HeaderApiVerifiedCallback
    ): Promise<AuthenticatedApiKey> {
        const apiKeyDb = await this.authService.validateApiKey(apiKey);
        if (!apiKeyDb) {
            throw new UnauthorizedException(ErrorCodes.ApiKeyAuthFailed);
        }

        // TODO: We should not need to create a user id for the api key as it's not a user.
        // TODO: However, it's expected almost everywhere
        const userId = 1;
        const permissions = await this.permissionService.findPermissionGroupedByLevelForUser(
            userId
        );

        const user: AuthenticatedApiKey = {
            userId,
            username: "",
            permissions,
            fooApiField: "THIS IS AN API KEY REQUEST",
        };

        return user;
    }
}
