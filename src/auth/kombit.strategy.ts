import { samlPassportConf } from "@config/passport-saml.conf";
import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "@services/user-management/auth.service";
import { Profile, Strategy } from "passport-saml";
import { UserResponseDto } from "@dto/user-response.dto";

@Injectable()
export class KombitStrategy extends PassportStrategy(Strategy, "kombit") {
    constructor(private readonly authService: AuthService) {
        super(samlPassportConf);

    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async validate(profile: Profile, done: Function): Promise<UserResponseDto> {
        try {
            const exists = await this.authService.validateKombitUser(profile)
            done(null, exists);
            return exists;
        } catch (err) {
            done(err, false);
        }
    }
}
