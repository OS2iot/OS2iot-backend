import { AuthenticatedUser } from "./authenticated-user";
import { User } from "../entities/user.entity";

export type RequestHasAtLeastAUser = {
    user: AuthenticatedUser;
};

export type RequestHasAtLeastAUserLocalStrategy = {
    user: User;
};
