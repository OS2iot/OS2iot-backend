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
        callbackUrl: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/login/callback`,
        entryPoint: configuration()["kombit"]["entryPoint"],
        issuer: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/metadata`,
        audience: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/metadata`,
        idpCert: configuration()["kombit"]["certificatePublicKey"],
        privateKey: configuration()["kombit"]["certificatePrivateKey"],
        publicCert: configuration()["kombit"]["certificateOwnPublicKey"],
        decryptionPvk: configuration()["kombit"]["certificatePrivateKey"],
        signatureAlgorithm: "sha256",
        logoutCallbackUrl: `${configuration()["backend"]["baseurl"]}/api/v1/auth/kombit/logout/callback`,
        logoutUrl: configuration()["kombit"]["entryPoint"],
        acceptedClockSkewMs: 1000, // Allow some slack in clock sync
        disableRequestedAuthnContext: true,
        wantAuthnResponseSigned: false,
        identifierFormat: "",
        authnRequestBinding: "HTTP-Redirect",
      },
      function (profile: Profile, done: Function) {
        return this.validate(profile, done);
      }
    );
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public async validate(profile: Profile, done: Function): Promise<UserResponseDto> {
    this.logger.log("Profile", profile);
    const samlResponse = profile.getSamlResponseXml();
    this.logger.log("SAML Response", samlResponse);
    this.logger.log("AssertionXML", profile.getAssertionXml());

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
