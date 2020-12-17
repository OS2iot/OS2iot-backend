import configuration from "@config/configuration";
import { Injectable } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as nJwt from "njwt";

@Injectable()
export class JwtToken {
    static setupToken(): string {
        const claims = {
            iss: "as", // issuer of the claim
            aud: "as", // audience for which the claim is intended
            iat: Math.floor(new Date().valueOf() / 1000 - 10), // unix time from which the token is valid
            nbf: Math.floor(new Date().valueOf() / 1000 - 10), // unix time from which the token is valid
            exp: Math.floor(new Date().valueOf() / 1000) + 60 * 60 * 24 * 14, // unix time when the token expires
            sub: "user", // subject of the claim (an user)
            username: "admin", // username the client claims to be
        };

        const jwt = nJwt.create(
            claims,
            configuration()["chirpstack"]["jwtsecret"],
            "HS256"
        );
        const token = jwt.compact();
        return token;
    }
}
