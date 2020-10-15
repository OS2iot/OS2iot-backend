import * as fs from "fs";
import { SamlConfig } from "passport-saml";

/**
 *  https://github.com/bergie/passport-saml
 */
export const samlPassportConf: SamlConfig = {
    audience: "https://test.os2iot.dk",
    issuer: "https://test.os2iot.dk",

    identifierFormat: "", // "urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName",

    callbackUrl: "https://localhost:8443/api/v1/auth/kombit/login/callback",
    logoutCallbackUrl: "https://localhost:8443/api/v1/auth/kombit/logout/callback",
    logoutUrl: "https://localhost:8443/api/v1/auth/kombit/logout",
    entryPoint:
        "https://adgangsstyring.eksterntest-stoettesystemerne.dk/runtime/saml2/issue.idp",
    // logoutUrl: 'http://idp5.canadacentral.cloudapp.azure.com/opensso/IDPSloRedirect/metaAlias/idp',

    privateCert: fs.readFileSync("secrets/bm2-test-cert.key", "utf-8"),
    decryptionPvk: fs.readFileSync("secrets/bm2-test-cert.key", "utf-8"),

    signatureAlgorithm: "sha1",
    disableRequestedAuthnContext: true,
    // forceAuthn: false,
    // authnRequestBinding: "HTTP-Redirect",
    // RACComparison: "minimum",
    // passive: false,
};
