import { AuthenticatedUser } from "./authenticated-user";
import { User } from "../entities/user.entity";

export type AuthenticatedRequest = {
    user: AuthenticatedUser;
};

export type AuthenticatedRequestLocalStrategy = {
    user: User;
};
