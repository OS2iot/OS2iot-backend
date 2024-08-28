import configuration from "@config/configuration";
import { UserResponseDto } from "@dto/user-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "@services/user-management/auth.service";
import { Profile, Strategy } from "passport-saml";

@Injectable()
export class KombitStrategy extends PassportStrategy(Strategy, "kombit") {
    constructor(private readonly authService: AuthService) {
        super({
            issuer: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/metadata`,
            audience: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/metadata`,

            callbackUrl: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/login/callback`,
            logoutCallbackUrl: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/logout/callback`,
            logoutUrl: configuration()["kombit"]["entryPoint"],
            entryPoint: configuration()["kombit"]["entryPoint"],
            identifierFormat: "",
            cert: configuration()["kombit"]["certificatePublicKey"],
            privateCert: configuration()["kombit"]["certificatePrivateKey"],
            decryptionPvk: configuration()["kombit"]["certificatePrivateKey"],
            signatureAlgorithm: "sha256",
            disableRequestedAuthnContext: true,
            authnRequestBinding: "HTTP-Redirect",
            acceptedClockSkewMs: 1000, // Allow some slack in clock sync
        });
    }

    private readonly logger = new Logger(KombitStrategy.name);

    // eslint-disable-next-line @typescript-eslint/ban-types
    async validate(profile: Profile, done: Function): Promise<UserResponseDto> {
        try {
            const exists = await this.authService.validateKombitUser(profile);
            done(null, exists);
            return exists;
        } catch (err) {
            if (err?.message == ErrorCodes.MissingRole) {
                done(null, ErrorCodes.MissingRole);
                return null;
            }
            done(err, false);
        }
    }
}
