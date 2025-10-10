import configuration from "@config/configuration";
import { UserResponseDto } from "@dto/user-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "@services/user-management/auth.service";
import { Strategy as SamlStrategy } from "@node-saml/passport-saml";
import { Profile } from "@node-saml/node-saml";

@Injectable()
export class KombitStrategy extends PassportStrategy(SamlStrategy, "kombit") {
  private readonly logger = new Logger(KombitStrategy.name);

  constructor(private readonly authService: AuthService) {
    super(
      {
        issuer: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/metadata`,
        callbackUrl: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/login/callback`,
        publicCert: configuration()["kombit"]["certificatePublicKey"],
        idpCert: configuration()["kombit"]["certificatePublicKey"],
        audience: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/metadata`,
        logoutCallbackUrl: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/logout/callback`,
        logoutUrl: configuration()["kombit"]["entryPoint"],
        entryPoint: configuration()["kombit"]["entryPoint"],
        identifierFormat: "",
        decryptionPvk: configuration()["kombit"]["certificatePrivateKey"],
        signatureAlgorithm: "sha256",
        disableRequestedAuthnContext: true,
        authnRequestBinding: "HTTP-Redirect",
        acceptedClockSkewMs: 1000, // Allow some slack in clock sync
      },
      (req, profile, done) => {
        return this.validate(profile, done);
      }
    );
  }

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
