import { User } from "@entities/user.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { AuthenticatedApiKey } from "./authenticated-api-key";
import { AuthenticatedUser } from "./authenticated-user";

export type AuthenticatedRequest = {
    user: AuthenticatedUser;
};

export type AuthenticatedRequestLocalStrategy = {
    user: User;
};

export class AuthenticatedRequestKombitStrategy {
    user: User | ErrorCodes;
    cookies: any;
}

export type AuthenticatedApiKeyRequest = {
    user: AuthenticatedApiKey;
};
