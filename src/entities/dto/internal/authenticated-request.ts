import { User } from "@entities/user.entity";

import { AuthenticatedUser } from "./authenticated-user";

export type AuthenticatedRequest = {
    user: AuthenticatedUser;
};

export type AuthenticatedRequestLocalStrategy = {
    user: User;
};
