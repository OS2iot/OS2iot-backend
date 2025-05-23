import { AuthenticatedUser } from "@dto/internal/authenticated-user";
import { ErrorCodes } from "@enum/error-codes.enum";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "@services/user-management/auth.service";
import { PermissionService } from "@services/user-management/permission.service";
import { HeaderAPIKeyStrategy } from "passport-headerapikey";
import { ApiKeyHeader, ApiKeyStrategyName, HeaderApiVerifiedCallback } from "./constants";

const passReqToCallback = false;

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, ApiKeyStrategyName) {
  constructor(private authService: AuthService, private permissionService: PermissionService) {
    super(
      {
        header: ApiKeyHeader,
        prefix: "",
      },
      passReqToCallback
    );
  }

  async validate(apiKey: string, _done: HeaderApiVerifiedCallback): Promise<AuthenticatedUser> {
    const apiKeyDb = await this.authService.validateApiKey(apiKey);
    if (!apiKeyDb) {
      throw new UnauthorizedException(ErrorCodes.ApiKeyAuthFailed);
    }
    if (apiKeyDb.expiresOn < new Date()) {
      throw new UnauthorizedException(ErrorCodes.ApiKeyExpired);
    }

    // Get the permissions and the UserID from the API Key instead of the user
    const permissions = await this.permissionService.findPermissionGroupedByLevelForApiKey(apiKeyDb.id);

    // const permissions = dbApiKey.permissions as Permission[];
    const userId = apiKeyDb.systemUser.id;

    // Set the permissions and the userId on the returned user
    const user: AuthenticatedUser = {
      userId,
      username: apiKeyDb.systemUser.name,
      permissions,
    };

    return user;
  }
}
