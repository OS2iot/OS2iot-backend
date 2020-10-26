import { User } from "@entities/user.entity";
import { Request as req } from "express";
import { AuthenticatedUser } from "./authenticated-user";

export type AuthenticatedRequest = {
    user: AuthenticatedUser;
};

export type AuthenticatedRequestLocalStrategy = {
    user: User;
};

// export type AuthenticatedRequestKombitStrategy = {
//     user: User;
// };

export class AuthenticatedRequestKombitStrategy {
    user: User;
    cookies: any;
}
