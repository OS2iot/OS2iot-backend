import { samlPassportConf } from "@config/passport-saml.conf";
import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "@services/user-management/auth.service";
import { Strategy } from "passport-saml";
import * as fs from "fs";

@Injectable()
export class KombitStrategy extends PassportStrategy(Strategy, "kombit") {
    constructor(private readonly authService: AuthService) {
        super(samlPassportConf);
        Logger.log(samlPassportConf);
        Logger.log(
            this.generateServiceProviderMetadata(
                fs.readFileSync("secrets/FOCES_PUBLIC.crt", "utf-8"),
                fs.readFileSync("secrets/FOCES_PUBLIC.crt", "utf-8")
            )
        );
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    // eslint-disable-next-line @typescript-eslint/ban-types
    async validate(profile: any, done: Function) {
        try {
            done(null, profile);
        } catch (err) {
            done(err, false);
        }
    }
}
