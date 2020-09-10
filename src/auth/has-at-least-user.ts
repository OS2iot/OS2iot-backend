import { AuthenticatedUser } from "./authenticated-user";

export type RequestHasAtLeastAUser = {
    user: AuthenticatedUser;
};
